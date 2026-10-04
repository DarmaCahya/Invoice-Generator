import crypto from 'crypto';
import { db } from '@/lib/db';
import { hashPassword, verifyPassword } from '@/lib/hash';
import { signToken } from '@/lib/jwt';
import { sendInvitationEmail } from '@/lib/mailer';

export interface RegisterDTO {
  name: string;
  email: string;
  password: string;
  workspaceName?: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface InviteMemberDTO {
  workspaceId: string;
  inviterId: string;
  email: string;
  roleId?: string;
  baseUrl?: string;
}

export interface ActivateAccountDTO {
  token: string;
  password: string;
  name?: string;
}

export class AuthService {
  /**
   * Register direct user/owner (Active by default)
   */
  static async register(dto: RegisterDTO) {
    const existingUser = await db.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new Error('Email sudah terdaftar.');
    }

    const passwordHash = await hashPassword(dto.password);
    const user = await db.user.create({
      data: {
        name: dto.name,
        email: dto.email.toLowerCase(),
        passwordHash,
        isActive: true, // Direct signups are active
      },
    });

    // Create personal workspace for owner
    const wsName = dto.workspaceName || `${dto.name}'s Workspace`;
    const slug = `${wsName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;

    // Find default owner role if exists
    const ownerRole = await db.role.findFirst({
      where: { name: 'owner' },
    });

    const workspace = await db.workspace.create({
      data: {
        name: wsName,
        slug,
        ownerId: user.id,
        ...(ownerRole && {
          members: {
            create: {
              userId: user.id,
              roleId: ownerRole.id,
            },
          },
        }),
      },
    });

    const token = signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    return { user, workspace, token };
  }

  /**
   * Login user with active check
   */
  static async login(dto: LoginDTO) {
    const user = await db.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user || !user.passwordHash) {
      throw new Error('Email atau password tidak valid.');
    }

    const isValidPassword = await verifyPassword(dto.password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Email atau password tidak valid.');
    }

    // CHECK ACCOUNT ACTIVATION STATUS
    if (!user.isActive) {
      const error: any = new Error('Akun Anda belum aktif. Silakan lakukan aktivasi dari email undangan terlebih dahulu.');
      error.code = 'ACCOUNT_INACTIVE';
      throw error;
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isActive: user.isActive,
      },
      token,
    };
  }

  /**
   * Invite member to workspace & send activation email
   */
  static async inviteMember(dto: InviteMemberDTO) {
    const workspace = await db.workspace.findUnique({
      where: { id: dto.workspaceId },
    });
    if (!workspace) throw new Error('Workspace tidak ditemukan.');

    const inviter = await db.user.findUnique({
      where: { id: dto.inviterId },
    });
    if (!inviter) throw new Error('Inviter tidak ditemukan.');

    // Get default member role if roleId not provided
    let roleId = dto.roleId;
    if (!roleId) {
      const memberRole = await db.role.findFirst({ where: { name: 'member' } });
      roleId = memberRole?.id;
    }
    if (!roleId) {
      // Fallback: create default member role if missing
      const newRole = await db.role.create({
        data: { name: 'member', description: 'Default workspace member' },
      });
      roleId = newRole.id;
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

    // Create or update invitation record
    const invitation = await db.workspaceInvitation.create({
      data: {
        workspaceId: workspace.id,
        email: dto.email.toLowerCase(),
        roleId,
        token,
        expiresAt,
      },
    });

    // Check if user already exists
    let user = await db.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      // Create pending inactive user
      user = await db.user.create({
        data: {
          name: dto.email.split('@')[0],
          email: dto.email.toLowerCase(),
          isActive: false,
          activationToken: token,
          activationExpires: expiresAt,
        },
      });
    } else if (!user.isActive) {
      // Update activation token for existing inactive user
      user = await db.user.update({
        where: { id: user.id },
        data: {
          activationToken: token,
          activationExpires: expiresAt,
        },
      });
    }

    const host = dto.baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const activationUrl = `${host}/activate?token=${token}`;

    await sendInvitationEmail(dto.email, workspace.name, inviter.name, activationUrl);

    return { invitation, user, activationUrl };
  }

  /**
   * Activate account with token & set password
   */
  static async activateAccount(dto: ActivateAccountDTO) {
    if (!dto.token || !dto.password) {
      throw new Error('Token dan password wajib diisi.');
    }

    // Find invitation or user by token
    const invitation = await db.workspaceInvitation.findUnique({
      where: { token: dto.token },
      include: { workspace: true },
    });

    let user = await db.user.findFirst({
      where: {
        OR: [
          { activationToken: dto.token },
          ...(invitation ? [{ email: invitation.email }] : []),
        ],
      },
    });

    if (!user && !invitation) {
      throw new Error('Token aktivasi tidak valid atau telah kadaluarsa.');
    }

    const expiresAt = invitation?.expiresAt || user?.activationExpires;
    if (expiresAt && new Date() > expiresAt) {
      throw new Error('Token aktivasi telah kadaluarsa. Silakan minta undangan baru.');
    }

    const passwordHash = await hashPassword(dto.password);

    if (user) {
      user = await db.user.update({
        where: { id: user.id },
        data: {
          isActive: true,
          passwordHash,
          activationToken: null,
          activationExpires: null,
          ...(dto.name && { name: dto.name }),
        },
      });
    } else if (invitation) {
      // Create active user if was not created beforehand
      user = await db.user.create({
        data: {
          name: dto.name || invitation.email.split('@')[0],
          email: invitation.email,
          passwordHash,
          isActive: true,
        },
      });
    }

    if (!user) throw new Error('Gagal memproses aktivasi pengguna.');

    // Accept invitation & add to WorkspaceMember
    if (invitation && !invitation.acceptedAt) {
      await db.workspaceInvitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() },
      });

      // Add to WorkspaceMember if not already added
      const existingMember = await db.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: invitation.workspaceId,
            userId: user.id,
          },
        },
      });

      if (!existingMember) {
        await db.workspaceMember.create({
          data: {
            workspaceId: invitation.workspaceId,
            userId: user.id,
            roleId: invitation.roleId,
          },
        });
      }
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    return { user, token };
  }
}
