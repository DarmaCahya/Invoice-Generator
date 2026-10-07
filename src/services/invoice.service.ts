import { db } from '@/lib/db';

export interface CreateInvoiceInput {
  workspaceId?: string;
  templateId?: string;
  invoiceNumber: string;
  customerId: string;
  status?: string;
  issueDate?: string;
  dueDate: string;
  currency?: string;
  taxRate?: number;
  discount?: number;
  notes?: string;
  terms?: string;
  items: Array<{
    description: string;
    quantity: number;
    unit?: string;
    unitPrice: number;
    discount?: number;
    taxRate?: number;
    productId?: string;
  }>;
}

export class InvoiceService {
  static async getAllInvoices(workspaceId?: string) {
    return db.invoice.findMany({
      where: workspaceId ? { workspaceId } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: true,
        items: true,
        template: true,
        payments: true,
      },
    });
  }

  static async getInvoiceById(id: string) {
    return db.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        items: true,
        template: true,
        payments: true,
      },
    });
  }

  static async createInvoice(input: CreateInvoiceInput) {
    let workspaceId = input.workspaceId;
    if (!workspaceId) {
      const customer = await db.customer.findUnique({
        where: { id: input.customerId },
        select: { workspaceId: true },
      });
      workspaceId = customer?.workspaceId;
    }

    if (!workspaceId) {
      const defaultWs = await db.workspace.findFirst();
      workspaceId = defaultWs?.id;
    }

    if (!workspaceId) {
      throw new Error('Workspace ID is required to create an invoice.');
    }

    const defaultTaxRate = input.taxRate ?? 0;
    const discount = input.discount ?? 0;

    // Calculate item subtotals and taxes
    const processedItems = input.items.map((item) => {
      const itemTaxRate = item.taxRate ?? defaultTaxRate;
      const itemDiscount = item.discount ?? 0;
      const subtotal = item.quantity * item.unitPrice - itemDiscount;
      const tax = (subtotal * itemTaxRate) / 100;
      const total = subtotal + tax;

      return {
        description: item.description,
        quantity: item.quantity,
        unit: item.unit || 'pcs',
        unitPrice: item.unitPrice,
        discount: itemDiscount,
        taxRate: itemTaxRate,
        subtotal,
        tax,
        total,
        productId: item.productId || null,
      };
    });

    const subtotal = processedItems.reduce((sum, item) => sum + item.subtotal, 0);
    const taxAmount = processedItems.reduce((sum, item) => sum + item.tax, 0);
    const totalAmount = subtotal + taxAmount - discount;

    return db.invoice.create({
      data: {
        workspaceId,
        customerId: input.customerId,
        templateId: input.templateId || null,
        invoiceNumber: input.invoiceNumber,
        status: input.status || 'unpaid',
        issueDate: input.issueDate ? new Date(input.issueDate) : new Date(),
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        currency: input.currency || 'IDR',
        subtotal,
        discount,
        tax: taxAmount,
        total: totalAmount,
        amountPaid: 0,
        amountDue: totalAmount,
        notes: input.notes,
        terms: input.terms,
        items: {
          create: processedItems.map((it) => ({
            description: it.description,
            quantity: it.quantity,
            unit: it.unit,
            unitPrice: it.unitPrice,
            discount: it.discount,
            taxRate: it.taxRate,
            subtotal: it.subtotal,
            tax: it.tax,
            total: it.total,
            productId: it.productId,
          })),
        },
      },
      include: {
        customer: true,
        items: true,
        template: true,
        payments: true,
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
        template: true,
        payments: true,
      },
    });
  }

  static async deleteInvoice(id: string) {
    return db.invoice.delete({
      where: { id },
    });
  }
}
