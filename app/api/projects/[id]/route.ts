import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/auth';
import { ProjectService } from '@/lib/projects/project-service';

const projectService = new ProjectService();

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { id } = await params;
    const project = await projectService.getProjectById(id);

    if (!project) {
      return NextResponse.json({ error: '项目不存在' }, { status: 404 });
    }

    if (project.userId !== session.user.id) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('获取项目失败:', error);
    return NextResponse.json({ error: '获取项目失败' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { id } = await params;
    const project = await projectService.getProjectById(id);

    if (!project) {
      return NextResponse.json({ error: '项目不存在' }, { status: 404 });
    }

    if (project.userId !== session.user.id) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, color } = body;

    const updatedProject = await projectService.updateProject(id, {
      name,
      description,
      color,
    });

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error('更新项目失败:', error);
    return NextResponse.json({ error: '更新项目失败' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { id } = await params;
    const project = await projectService.getProjectById(id);

    if (!project) {
      return NextResponse.json({ error: '项目不存在' }, { status: 404 });
    }

    if (project.userId !== session.user.id) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    await projectService.deleteProject(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除项目失败:', error);
    return NextResponse.json({ error: '删除项目失败' }, { status: 500 });
  }
}
