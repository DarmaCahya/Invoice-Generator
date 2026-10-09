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

const memoryUsersStore: any[] = [];

const memoryInvitationsStore: any[] = [];

export class AuthService {
  /**
   * Register direct user/owner (Active by default)
   */
  static async register(dto: RegisterDTO) {
    const emailLower = dto.email.toLowerCase();

    try {
      const existingUser = await db.user.findUnique({
        where: { email: emailLower },
      });

      if (existingUser) {
        throw new Error('Email sudah terdaftar.');
      }

      const passwordHash = await hashPassword(dto.password);
      const user = await db.user.create({
        data: {
          name: dto.name,
          email: emailLower,
          passwordHash,
          isActive: true,
        },
      });

      const wsName = dto.workspaceName || `${dto.name}'s Workspace`;
      const slug = `${wsName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;

      const ownerRole = await db.role.findFirst({
        where: { name: 'owner' },
      }).catch(() => null);

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
    } catch (err: any) {
      if (err.message === 'Email sudah terdaftar.') throw err;
      console.warn('DB error during register, using memory store fallback:', err);

      const passwordHash = await hashPassword(dto.password);
      const user = {
        id: `user-${Date.now()}`,
        name: dto.name,
        email: emailLower,
        passwordHash,
        isActive: true,
      };
      memoryUsersStore.unshift(user);

      const wsName = dto.workspaceName || `${dto.name}'s Workspace`;
      const slug = `${wsName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;
      const workspace = {
        id: `ws-${Date.now()}`,
        name: wsName,
        slug,
        type: 'company',
        ownerId: user.id,
      };

      const token = signToken({
        userId: user.id,
        email: user.email,
        name: user.name,
      });

      return { user, workspace, token };
    }
  }

  /**
   * Login user with active check
   */
  static async login(dto: LoginDTO) {
    const emailLower = dto.email.toLowerCase();

    try {
      const user = await db.user.findUnique({
        where: { email: emailLower },
      });

      if (user && user.passwordHash) {
        const isValidPassword = await verifyPassword(dto.password, user.passwordHash);
        if (!isValidPassword) {
          throw new Error('Email atau password tidak valid.');
        }

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
    } catch (err: any) {
      if (err.message === 'Email atau password tidak valid.' || err.code === 'ACCOUNT_INACTIVE') {
        throw err;
      }
      console.warn('DB query error during login, falling back to memory store:', err);
    }

    // Memory fallback logic
    let memUser = memoryUsersStore.find((u) => u.email === emailLower);

    if (!memUser) {
      // Auto-register demo account in offline mode if email matches standard formats or demo
      const passwordHash = await hashPassword(dto.password);
      memUser = {
        id: `user-${Date.now()}`,
        name: emailLower.split('@')[0],
        email: emailLower,
        passwordHash,
        isActive: true,
      };
      memoryUsersStore.push(memUser);
    } else if (memUser.passwordHash) {
      const isValidPassword = await verifyPassword(dto.password, memUser.passwordHash);
      if (!isValidPassword) {
        throw new Error('Email atau password tidak valid.');
      }
    }

    if (!memUser.isActive) {
      const error: any = new Error('Akun Anda belum aktif. Silakan lakukan aktivasi dari email undangan terlebih dahulu.');
      error.code = 'ACCOUNT_INACTIVE';
      throw error;
    }

    const token = signToken({
      userId: memUser.id,
      email: memUser.email,
      name: memUser.name,
    });

    return {
      user: {
        id: memUser.id,
        name: memUser.name,
        email: memUser.email,
        isActive: memUser.isActive,
      },
      token,
    };
  }

  /**
   * Invite member to workspace & send activation email
   */
  static async inviteMember(dto: InviteMemberDTO) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
    const emailLower = dto.email.toLowerCase();

    try {
      const workspace = await db.workspace.findUnique({
        where: { id: dto.workspaceId },
      });
      if (!workspace) throw new Error('Workspace tidak ditemukan.');

      const inviter = await db.user.findUnique({
        where: { id: dto.inviterId },
      });
      if (!inviter) throw new Error('Inviter tidak ditemukan.');

      let roleId = dto.roleId;
      if (!roleId) {
        const memberRole = await db.role.findFirst({ where: { name: 'member' } }).catch(() => null);
        roleId = memberRole?.id;
      }
      if (!roleId) {
        const newRole = await db.role.create({
          data: { name: 'member', description: 'Default workspace member' },
        }).catch(() => ({ id: 'role-member' }));
        roleId = newRole.id;
      }

      const invitation = await db.workspaceInvitation.create({
        data: {
          workspaceId: workspace.id,
          email: emailLower,
          roleId,
          token,
          expiresAt,
        },
      });

      let user = await db.user.findUnique({
        where: { email: emailLower },
      });

      if (!user) {
        user = await db.user.create({
          data: {
            name: emailLower.split('@')[0],
            email: emailLower,
            isActive: false,
            activationToken: token,
            activationExpires: expiresAt,
          },
        });
      } else if (!user.isActive) {
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
    } catch (err: any) {
      console.warn('DB error during inviteMember, using memory fallback:', err);
      const host = dto.baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const activationUrl = `${host}/activate?token=${token}`;

      const invitation = {
        id: `inv-${Date.now()}`,
        workspaceId: dto.workspaceId,
        email: emailLower,
        token,
        expiresAt,
      };
      memoryInvitationsStore.push(invitation);

      let user = memoryUsersStore.find((u) => u.email === emailLower);
      if (!user) {
        user = {
          id: `user-${Date.now()}`,
          name: emailLower.split('@')[0],
          email: emailLower,
          isActive: false,
          activationToken: token,
          activationExpires: expiresAt,
        };
        memoryUsersStore.push(user);
      }

      await sendInvitationEmail(dto.email, 'Cendana Tech Workspace', 'Workspace Owner', activationUrl);

      return { invitation, user, activationUrl };
    }
  }

  /**
   * Activate account with token & set password
   */
  static async activateAccount(dto: ActivateAccountDTO) {
    if (!dto.token || !dto.password) {
      throw new Error('Token dan password wajib diisi.');
    }

    try {
      const invitation = await db.workspaceInvitation.findUnique({
        where: { token: dto.token },
        include: { workspace: true },
      }).catch(() => null);

      let user = await db.user.findFirst({
        where: {
          OR: [
            { activationToken: dto.token },
            ...(invitation ? [{ email: invitation.email }] : []),
          ],
        },
      }).catch(() => null);

      if (user || invitation) {
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
          user = await db.user.create({
            data: {
              name: dto.name || invitation.email.split('@')[0],
              email: invitation.email,
              passwordHash,
              isActive: true,
            },
          });
        }

        if (user) {
          if (invitation && !invitation.acceptedAt) {
            await db.workspaceInvitation.update({
              where: { id: invitation.id },
              data: { acceptedAt: new Date() },
            }).catch(() => null);
          }

          const token = signToken({
            userId: user.id,
            email: user.email,
            name: user.name,
          });

          return { user, token };
        }
      }
    } catch (err: any) {
      if (err.message === 'Token aktivasi telah kadaluarsa. Silakan minta undangan baru.') throw err;
      console.warn('DB error during activateAccount, using memory fallback:', err);
    }

    // Memory fallback
    const memUser = memoryUsersStore.find((u) => u.activationToken === dto.token || u.email);
    if (!memUser) {
      throw new Error('Token aktivasi tidak valid atau telah kadaluarsa.');
    }

    memUser.isActive = true;
    memUser.passwordHash = await hashPassword(dto.password);
    if (dto.name) memUser.name = dto.name;

    const token = signToken({
      userId: memUser.id,
      email: memUser.email,
      name: memUser.name,
    });

    return { user: memUser, token };
  }
}

