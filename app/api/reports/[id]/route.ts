/**
 * 报告详情 API
 * GET - 获取报告详情
 * PUT - 更新报告
 * DELETE - 删除报告
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/auth';
import { reportService } from '@/lib/reports/report-service';

/**
 * GET /api/reports/[id]
 * 获取报告详情
 */
export async function GET(
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

    const report = await reportService.getReportById(id, userId);

    if (!report) {
      return NextResponse.json({ error: '报告不存在' }, { status: 404 });
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error('获取报告详情失败:', error);
    return NextResponse.json(
      { error: '获取报告详情失败' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/reports/[id]
 * 更新报告信息
 */
export async function PUT(
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

    const { title, topic } = body;

    const report = await reportService.updateReport(id, { title, topic }, userId);

    return NextResponse.json(report);
  } catch (error) {
    console.error('更新报告失败:', error);
    return NextResponse.json(
      { error: '更新报告失败' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/reports/[id]
 * 删除报告
 */
export async function DELETE(
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

    await reportService.deleteReport(id, userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除报告失败:', error);
    return NextResponse.json(
      { error: '删除报告失败' },
      { status: 500 }
    );
  }
}
