import { NextResponse } from 'next/server';
import { WorkspaceService } from '@/services/workspace.service';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id } = await params;
    const workspace = await WorkspaceService.getWorkspaceById(id);
    if (!workspace) {
      return NextResponse.json({ message: 'Workspace tidak ditemukan' }, { status: 404 });
    }
    return NextResponse.json(workspace);
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
