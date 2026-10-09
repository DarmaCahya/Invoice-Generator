import { NextResponse } from 'next/server';
import { AuthService } from '@/services/auth.service';
import { WorkspaceService } from '@/services/workspace.service';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id: workspaceId } = await params;
    const body = await req.json();
    let { inviterId, email, roleId } = body;

    if (!email) {
      return NextResponse.json(
        { message: 'Email wajib diisi.' },
        { status: 400 }
      );
    }

    if (!inviterId) {
      const ws = await WorkspaceService.getWorkspaceById(workspaceId);
      inviterId = (ws as any)?.ownerId || 'admin-1';
    }

    const origin = req.headers.get('origin') || 'http://localhost:3000';

    const result = await AuthService.inviteMember({
      workspaceId,
      inviterId,
      email,
      roleId,
      baseUrl: origin,
    });

    return NextResponse.json(
      {
        message: 'Undangan berhasil dikirim via email.',
        invitation: result.invitation,
        activationUrl: result.activationUrl,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Gagal mengirim undangan.' },
      { status: 400 }
    );
  }
}
