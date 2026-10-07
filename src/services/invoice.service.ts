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

const memoryInvoicesStore: any[] = [];

export class InvoiceService {
  static async getAllInvoices(workspaceId?: string) {
    try {
      const dbInvs = await db.invoice.findMany({
        where: workspaceId ? { workspaceId } : undefined,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: true,
          items: true,
          template: true,
          payments: true,
        },
      });

      const formattedDbInvs = dbInvs.map((inv) => ({
        ...inv,
        subtotal: Number(inv.subtotal),
        discount: Number(inv.discount),
        tax: Number(inv.tax),
        total: Number(inv.total),
        totalAmount: Number(inv.total),
        amountPaid: Number(inv.amountPaid),
        amountDue: Number(inv.amountDue),
        items: inv.items.map((it) => ({
          ...it,
          quantity: Number(it.quantity),
          unitPrice: Number(it.unitPrice),
          discount: Number(it.discount),
          taxRate: Number(it.taxRate),
          subtotal: Number(it.subtotal),
          tax: Number(it.tax),
          total: Number(it.total),
          amount: Number(it.total),
        })),
      }));

      const filteredMem = memoryInvoicesStore.filter((i) => !workspaceId || i.workspaceId === workspaceId);
      return [...formattedDbInvs, ...filteredMem];
    } catch {
      return memoryInvoicesStore.filter((i) => !workspaceId || i.workspaceId === workspaceId);
    }
  }

  static async getInvoiceById(id: string) {
    try {
      const found = await db.invoice.findUnique({
        where: { id },
        include: {
          customer: true,
          items: true,
          template: true,
          payments: true,
        },
      });

      if (found) {
        return {
          ...found,
          subtotal: Number(found.subtotal),
          discount: Number(found.discount),
          tax: Number(found.tax),
          total: Number(found.total),
          totalAmount: Number(found.total),
          amountPaid: Number(found.amountPaid),
          amountDue: Number(found.amountDue),
          items: found.items.map((it) => ({
            ...it,
            quantity: Number(it.quantity),
            unitPrice: Number(it.unitPrice),
            discount: Number(it.discount),
            taxRate: Number(it.taxRate),
            subtotal: Number(it.subtotal),
            tax: Number(it.tax),
            total: Number(it.total),
            amount: Number(it.total),
          })),
        };
      }
    } catch {}

    return memoryInvoicesStore.find((i) => i.id === id) || null;
  }

  static async createInvoice(input: CreateInvoiceInput) {
    let workspaceId = input.workspaceId || 'ws-default-1';

    const defaultTaxRate = input.taxRate ?? 0;
    const discount = input.discount ?? 0;

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
        amount: total,
        productId: item.productId || null,
      };
    });

    const subtotal = processedItems.reduce((sum, item) => sum + item.subtotal, 0);
    const taxAmount = processedItems.reduce((sum, item) => sum + item.tax, 0);
    const totalAmount = subtotal + taxAmount - discount;

    try {
      if (!input.workspaceId) {
        const customer = await db.customer.findUnique({
          where: { id: input.customerId },
          select: { workspaceId: true },
        }).catch(() => null);
        if (customer?.workspaceId) workspaceId = customer.workspaceId;
      }

      const inv = await db.invoice.create({
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

      return {
        ...inv,
        subtotal: Number(inv.subtotal),
        discount: Number(inv.discount),
        tax: Number(inv.tax),
        total: Number(inv.total),
        totalAmount: Number(inv.total),
        amountPaid: Number(inv.amountPaid),
        amountDue: Number(inv.amountDue),
        items: inv.items.map((it) => ({
          ...it,
          quantity: Number(it.quantity),
          unitPrice: Number(it.unitPrice),
          discount: Number(it.discount),
          taxRate: Number(it.taxRate),
          subtotal: Number(it.subtotal),
          tax: Number(it.tax),
          total: Number(it.total),
          amount: Number(it.total),
        })),
      };
    } catch {
      const newInv = {
        id: `inv-${Date.now()}`,
        workspaceId,
        customerId: input.customerId,
        customer: { id: input.customerId, name: 'Pelanggan Invoice', email: 'client@company.com' },
        invoiceNumber: input.invoiceNumber,
        status: input.status || 'unpaid',
        issueDate: input.issueDate || new Date().toISOString(),
        dueDate: input.dueDate,
        currency: input.currency || 'IDR',
        subtotal,
        discount,
        tax: taxAmount,
        total: totalAmount,
        totalAmount,
        notes: input.notes,
        terms: input.terms,
        items: processedItems,
      };
      memoryInvoicesStore.unshift(newInv);
      return newInv;
    }
  }

  static async updateInvoiceStatus(id: string, status: string) {
    try {
      const updated = await db.invoice.update({
        where: { id },
        data: { status },
        include: {
          customer: true,
          items: true,
          template: true,
          payments: true,
        },
      });
      return {
        ...updated,
        subtotal: Number(updated.subtotal),
        discount: Number(updated.discount),
        tax: Number(updated.tax),
        total: Number(updated.total),
        totalAmount: Number(updated.total),
      };
    } catch {
      const found = memoryInvoicesStore.find((i) => i.id === id);
      if (found) {
        found.status = status;
        return found;
      }
      throw new Error('Invoice not found');
    }
  }

  static async deleteInvoice(id: string) {
    try {
      return await db.invoice.delete({
        where: { id },
      });
    } catch {
      const idx = memoryInvoicesStore.findIndex((i) => i.id === id);
      if (idx !== -1) memoryInvoicesStore.splice(idx, 1);
      return { success: true };
    }
  }
}
