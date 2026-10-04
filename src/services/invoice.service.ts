import { db } from '@/lib/db';

export interface CreateInvoiceInput {
  invoiceNumber: string;
  customerId: string;
  status?: string;
  issueDate?: string;
  dueDate: string;
  taxRate?: number;
  discount?: number;
  notes?: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
}

export class InvoiceService {
  static async getAllInvoices() {
    return db.invoice.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        customer: true,
        items: true,
      },
    });
  }

  static async getInvoiceById(id: string) {
    return db.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        items: true,
      },
    });
  }

  static async createInvoice(input: CreateInvoiceInput) {
    const taxRate = input.taxRate ?? 0;
    const discount = input.discount ?? 0;

    // Calculate item subtotal
    const processedItems = input.items.map((item) => {
      const amount = item.quantity * item.unitPrice;
      return {
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount,
      };
    });

    const subtotal = processedItems.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = (subtotal * taxRate) / 100;
    const totalAmount = subtotal + taxAmount - discount;

    return db.invoice.create({
      data: {
        invoiceNumber: input.invoiceNumber,
        customerId: input.customerId,
        status: input.status || 'PENDING',
        issueDate: input.issueDate ? new Date(input.issueDate) : new Date(),
        dueDate: new Date(input.dueDate),
        subtotal,
        tax: taxAmount,
        discount,
        total: totalAmount,
        notes: input.notes,
        items: {
          create: processedItems.map(it => ({
            description: it.description,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            subtotal: it.amount,
            total: it.amount,
          })),
        },
      },
      include: {
        customer: true,
        items: true,
      },
    });
  }

  static async updateInvoiceStatus(id: string, status: string) {
    return db.invoice.update({
      where: { id },
      data: { status },
      include: {
        customer: true,
        items: true,
      },
    });
  }

  static async deleteInvoice(id: string) {
    return db.invoice.delete({
      where: { id },
    });
  }
}
