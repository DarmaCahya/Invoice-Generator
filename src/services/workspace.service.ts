import { db } from '@/lib/db';

export interface CreateWorkspaceInput {
  name: string;
  type?: string; // 'company' | 'personal'
  slug?: string;
  ownerId?: string;
}

const memoryWorkspacesStore: any[] = [];

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

      const dbIds = new Set(workspaces.map((w) => w.id));
      const memoryOnly = memoryWorkspacesStore.filter((mw) => !dbIds.has(mw.id));
      return [...workspaces, ...memoryOnly];
    } catch (err) {
      console.warn('DB read error for workspaces, returning fallback list:', err);
      return memoryWorkspacesStore;
    }
  }

  static async createWorkspace(input: CreateWorkspaceInput) {
    let ownerId = input.ownerId;
    const slug = input.slug || input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString().slice(-4);

    try {
      if (!ownerId) {
        const firstUser = await db.user.findFirst().catch(() => null);
        if (firstUser?.id) {
          ownerId = firstUser.id;
        } else {
          const newUser = await db.user.create({
            data: {
              name: 'Owner Admin',
              email: `owner_${Date.now()}@cendanatech.com`,
              isActive: true,
            },
          }).catch(() => null);
          ownerId = newUser?.id || 'owner-1';
        }
      }

      return await db.workspace.create({
        data: {
          name: input.name,
          slug,
          type: input.type || 'company',
          ownerId,
        },
      });
    } catch (err) {
      console.warn('DB write error for workspace creation, using memory store fallback:', err);
      const newWs = {
        id: `ws-${Date.now()}`,
        name: input.name,
        slug,
        type: input.type || 'company',
        ownerId: ownerId || 'owner-1',
        createdAt: new Date().toISOString(),
        _count: { invoices: 0, customers: 0, members: 1 },
      };
      memoryWorkspacesStore.unshift(newWs);
      return newWs;
    }
  }
}

