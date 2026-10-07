import { NextResponse } from 'next/server';
import { InvoiceService } from '@/services/invoice.service';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId') || request.headers.get('x-workspace-id') || undefined;
    const invoices = await InvoiceService.getAllInvoices(workspaceId);
    return NextResponse.json(invoices);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch invoices' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.invoiceNumber || !body.customerId || !body.dueDate || !body.items || body.items.length === 0) {
      return NextResponse.json(
        { error: 'invoiceNumber, customerId, dueDate, and at least 1 item are required' },
        { status: 400 }
      );
    }

    const workspaceId = body.workspaceId || request.headers.get('x-workspace-id') || undefined;
    const invoice = await InvoiceService.createInvoice({ ...body, workspaceId });
    return NextResponse.json(invoice, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create invoice' }, { status: 500 });
  }
}
