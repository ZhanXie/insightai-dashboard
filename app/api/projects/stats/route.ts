/**
 * 项目统计 API
 * GET - 获取项目相关统计数据
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/auth';
import { ProjectService } from '@/lib/projects/project-service';

const projectService = new ProjectService();

/**
 * GET /api/projects/stats
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const stats = await projectService.getProjectStats(session.user.id);

    return NextResponse.json(stats);
  } catch (error) {
    console.error('获取项目统计失败:', error);
    return NextResponse.json({ error: '获取项目统计失败' }, { status: 500 });
  }
}
