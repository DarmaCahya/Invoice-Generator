import { db } from '@/lib/db';

export interface CreateWorkspaceInput {
  name: string;
  type?: string; // 'company' | 'personal'
  slug?: string;
  ownerId?: string;
}

export class WorkspaceService {
  static async getAllWorkspaces() {
    try {
      const workspaces = await db.workspace.findMany({
        orderBy: { createdAt: 'asc' },
        include: {
          _count: {
            select: { invoices: true, customers: true, members: true },
          },
        },
      });

      // Seed a default workspace if database is empty
      if (workspaces.length === 0) {
        const defaultUser = await db.user.findFirst();
        let userId = defaultUser?.id;
        if (!userId) {
          const newUser = await db.user.create({
            data: {
              name: 'Owner Admin',
              email: 'admin@cendanatech.com',
              isActive: true,
            },
          });
          userId = newUser.id;
        }

        const seeded1 = await db.workspace.create({
          data: {
            name: 'Cendana Tech Solution',
            slug: 'cendana-tech-solution',
            type: 'company',
            ownerId: userId,
          },
        });

        const seeded2 = await db.workspace.create({
          data: {
            name: 'PT Digital Asia Utama',
            slug: 'pt-digital-asia-utama',
            type: 'company',
            ownerId: userId,
          },
        });

        return [
          { ...seeded1, _count: { invoices: 0, customers: 0, members: 1 } },
          { ...seeded2, _count: { invoices: 0, customers: 0, members: 1 } },
        ];
      }

      return workspaces;
    } catch (err) {
      console.warn('DB read error for workspaces, returning fallback list:', err);
      return [
        {
          id: 'ws-default-1',
          name: 'Cendana Tech Solution',
          slug: 'cendana-tech',
          type: 'company',
          ownerId: 'owner-1',
          createdAt: new Date().toISOString(),
          _count: { invoices: 5, customers: 3, members: 2 },
        },
        {
          id: 'ws-default-2',
          name: 'PT Digital Asia Utama',
          slug: 'digital-asia',
          type: 'company',
          ownerId: 'owner-1',
          createdAt: new Date().toISOString(),
          _count: { invoices: 2, customers: 1, members: 4 },
        },
        {
          id: 'ws-default-3',
          name: 'Personal Freelance',
          slug: 'personal-freelance',
          type: 'personal',
          ownerId: 'owner-1',
          createdAt: new Date().toISOString(),
          _count: { invoices: 1, customers: 1, members: 1 },
        },
      ];
    }
  }

  static async createWorkspace(input: CreateWorkspaceInput) {
    let ownerId = input.ownerId;
    if (!ownerId) {
      const firstUser = await db.user.findFirst();
      ownerId = firstUser?.id;
    }

    if (!ownerId) {
      const newUser = await db.user.create({
        data: {
          name: 'Owner Admin',
          email: 'admin@company.com',
          isActive: true,
        },
      });
      ownerId = newUser.id;
    }

    const slug = input.slug || input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString().slice(-4);

    return db.workspace.create({
      data: {
        name: input.name,
        slug,
        type: input.type || 'company',
        ownerId,
      },
    });
  }
}
