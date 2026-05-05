/**
 * 报告列表 API
 * GET - 获取报告列表
 * POST - 创建报告
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/auth';
import { reportService } from '@/lib/reports/report-service';

/**
 * GET /api/reports
 * 获取用户的报告列表
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') || undefined;
    const projectId = searchParams.get('projectId') || undefined;

    const result = await reportService.getReports({
      userId,
      page,
      limit,
      status,
      projectId,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('获取报告列表失败:', error);
    return NextResponse.json(
      { error: '获取报告列表失败' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reports
 * 创建新报告
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();

    const { topic, templateId, projectId, title } = body;

    if (!topic || !templateId) {
      return NextResponse.json(
        { error: '缺少必要参数：topic, templateId' },
        { status: 400 }
      );
    }

    const report = await reportService.createReport({
      userId,
      topic,
      templateId,
      projectId,
      title,
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error('创建报告失败:', error);
    return NextResponse.json(
      { error: '创建报告失败' },
      { status: 500 }
    );
  }
}
