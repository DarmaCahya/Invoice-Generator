import { NextResponse } from 'next/server';
import { ProjectService } from '@/services/project.service';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId') || request.headers.get('x-workspace-id') || undefined;

    const projects = await ProjectService.getAllProjects(workspaceId);
    return NextResponse.json(projects);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.name || !body.customerId) {
      return NextResponse.json(
        { error: 'Project name and customerId are required' },
        { status: 400 }
      );
    }

    const workspaceId = body.workspaceId || request.headers.get('x-workspace-id') || undefined;
    const project = await ProjectService.createProject({ ...body, workspaceId });
    return NextResponse.json(project, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create project' }, { status: 500 });
  }
}
