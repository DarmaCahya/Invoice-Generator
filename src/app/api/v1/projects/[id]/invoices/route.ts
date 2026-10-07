import { NextResponse } from 'next/server';
import { ProjectService } from '@/services/project.service';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json().catch(() => ({}));
    const milestoneId = body.milestoneId || undefined;

    const invoice = await ProjectService.createInvoiceFromProject(params.id, milestoneId);
    return NextResponse.json(invoice, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to generate invoice from project' }, { status: 500 });
  }
}
