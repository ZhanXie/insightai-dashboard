/**
 * 文档分配到项目 API
 * POST - 将文档分配/转移到指定项目
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/auth';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/documents/[id]/assign
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const userId = session.user.id;
    const { id } = await params;
    const body = await request.json();
    const { projectId } = body;

    // 检查文档是否存在且属于当前用户
    const document = await prisma.document.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!document) {
      return NextResponse.json({ error: '文档不存在' }, { status: 404 });
    }

    // 如果指定了 projectId，检查项目是否存在且属于当前用户
    if (projectId) {
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          userId,
        },
      });

      if (!project) {
        return NextResponse.json({ error: '项目不存在' }, { status: 404 });
      }
    }

    // 更新文档的项目关联（支持设为 null 来取消分配）
    const updatedDocument = await prisma.document.update({
      where: { id },
      data: {
        projectId: projectId || null,
      },
    });

    return NextResponse.json(updatedDocument);
  } catch (error) {
    console.error('分配文档失败:', error);
    return NextResponse.json(
      { error: '分配文档失败' },
      { status: 500 }
    );
  }
}
