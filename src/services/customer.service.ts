import { db } from '@/lib/db';

export class CustomerService {
  static async getAllCustomers(workspaceId?: string) {
    return db.customer.findMany({
      where: workspaceId ? { workspaceId } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { invoices: true },
        },
      },
    });
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
    let workspaceId = data.workspaceId;
    if (!workspaceId) {
      const defaultWs = await db.workspace.findFirst();
      workspaceId = defaultWs?.id;
    }

    if (!workspaceId) {
      throw new Error('Workspace ID is required to create a customer.');
    }

    return db.customer.create({
      data: {
        workspaceId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address || (data.company ? `Company: ${data.company}` : undefined),
        taxNumber: data.taxNumber,
      },
    });
  }

  static async getCustomerById(id: string) {
    return db.customer.findUnique({
      where: { id },
    });
  }
}
