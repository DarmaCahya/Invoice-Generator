import { NextResponse } from 'next/server';
import { WorkspaceService } from '@/services/workspace.service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const workspaces = await WorkspaceService.getAllWorkspaces();
    return NextResponse.json(workspaces);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch workspaces' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.name) {
      return NextResponse.json({ error: 'Nama perusahaan / workspace wajib diisi' }, { status: 400 });
    }

    const workspace = await WorkspaceService.createWorkspace(body);
    return NextResponse.json(workspace, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create workspace' }, { status: 500 });
  }
}
