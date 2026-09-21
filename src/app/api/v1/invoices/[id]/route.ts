import { NextResponse } from 'next/server';
import { InvoiceService } from '@/services/invoice.service';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const invoice = await InvoiceService.getInvoiceById(params.id);
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }
    return NextResponse.json(invoice);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch invoice' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    if (!body.status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    const updated = await InvoiceService.updateInvoiceStatus(params.id, body.status);
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update invoice' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await InvoiceService.deleteInvoice(params.id);
    return NextResponse.json({ success: true, message: 'Invoice deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete invoice' }, { status: 500 });
  }
}
