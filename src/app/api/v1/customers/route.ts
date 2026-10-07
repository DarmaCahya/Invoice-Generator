import { NextResponse } from 'next/server';
import { CustomerService } from '@/services/customer.service';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId') || request.headers.get('x-workspace-id') || undefined;
    const customers = await CustomerService.getAllCustomers(workspaceId);
    return NextResponse.json(customers);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch customers' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.name || !body.email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    const workspaceId = body.workspaceId || request.headers.get('x-workspace-id') || undefined;
    const customer = await CustomerService.createCustomer({ ...body, workspaceId });
    return NextResponse.json(customer, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create customer' }, { status: 500 });
  }
}
