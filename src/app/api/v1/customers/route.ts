import { NextResponse } from 'next/server';
import { CustomerService } from '@/services/customer.service';

export async function GET() {
  try {
    const customers = await CustomerService.getAllCustomers();
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

    const customer = await CustomerService.createCustomer(body);
    return NextResponse.json(customer, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create customer' }, { status: 500 });
  }
}
