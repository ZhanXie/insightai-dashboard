import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/auth';
import { prisma } from '@/lib/prisma';
import { ProjectService } from '@/lib/projects/project-service';

const projectService = new ProjectService();

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const result = await projectService.getProjects(session.user.id, page, limit);
    return NextResponse.json(result);
  } catch (error) {
    console.error('获取项目列表失败:', error);
    return NextResponse.json({ error: '获取项目列表失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    // 验证用户是否存在于数据库中，防止外键约束报错 (P2003)
    // 这种情况通常发生在数据库重置但浏览器缓存了旧 Session 时
    const userExists = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true },
    });
    if (!userExists) {
      return NextResponse.json(
        { error: '用户会话无效或用户不存在，请退出重新登录' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, description, color } = body;

    if (!name) {
      return NextResponse.json({ error: '项目名称不能为空' }, { status: 400 });
    }

    const project = await projectService.createProject(
      session.user.id,
      name,
      description,
      color
    );

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('创建项目失败:', error);
    return NextResponse.json({ error: '创建项目失败' }, { status: 500 });
  }
}
