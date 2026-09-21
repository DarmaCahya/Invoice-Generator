import { db } from '@/lib/db';

export class CustomerService {
  static async getAllCustomers() {
    return db.customer.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { invoices: true },
        },
      },
    });
  }

  static async createCustomer(data: {
    name: string;
    email: string;
    phone?: string;
    company?: string;
    address?: string;
  }) {
    return db.customer.create({
      data,
    });
  }

  static async getCustomerById(id: string) {
    return db.customer.findUnique({
      where: { id },
    });
  }
}
