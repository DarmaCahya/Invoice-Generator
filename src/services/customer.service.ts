import { db } from '@/lib/db';

const memoryCustomersStore: any[] = [];

export class CustomerService {
  static async getAllCustomers(workspaceId?: string) {
    try {
      const dbCusts = await db.customer.findMany({
        where: workspaceId ? { workspaceId } : undefined,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { invoices: true },
          },
        },
      });
      const filteredMem = memoryCustomersStore.filter((c) => !workspaceId || c.workspaceId === workspaceId);
      return [...dbCusts, ...filteredMem];
    } catch {
      return memoryCustomersStore.filter((c) => !workspaceId || c.workspaceId === workspaceId);
    }
  }

  static async createCustomer(data: {
    workspaceId?: string;
    name: string;
    email: string;
    phone?: string;
    company?: string;
    address?: string;
    taxNumber?: string;
  }) {
    let workspaceId = data.workspaceId || 'ws-default-1';

    try {
      if (!data.workspaceId) {
        const defaultWs = await db.workspace.findFirst().catch(() => null);
        workspaceId = defaultWs?.id || 'ws-default-1';
      }

      return await db.customer.create({
        data: {
          workspaceId,
          name: data.name,
          email: data.email,
          phone: data.phone,
          address: data.address || (data.company ? `Company: ${data.company}` : undefined),
          taxNumber: data.taxNumber,
        },
      });
    } catch {
      const newCust = {
        id: `cust-${Date.now()}`,
        workspaceId,
        name: data.name,
        email: data.email,
        phone: data.phone || '',
        address: data.address || (data.company ? `Company: ${data.company}` : ''),
        taxNumber: data.taxNumber || '',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      memoryCustomersStore.unshift(newCust);
      return newCust;
    }
  }

  static async getCustomerById(id: string) {
    try {
      const found = await db.customer.findUnique({
        where: { id },
      });
      if (found) return found;
    } catch {}
    return memoryCustomersStore.find((c) => c.id === id) || null;
  }
}
