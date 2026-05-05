/**
 * 报告导出 API
 * POST - 导出报告为指定格式
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/auth';
import { reportService } from '@/lib/reports/report-service';
import { exportService, ExportFormat } from '@/lib/export/export-service';

/**
 * POST /api/reports/[id]/export
 * 导出报告
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

    // 获取报告
    const report = await reportService.getReportById(id, userId);
    if (!report) {
      return NextResponse.json({ error: '报告不存在' }, { status: 404 });
    }

    // 检查报告状态
    if (report.status !== 'completed') {
      return NextResponse.json(
        { error: '报告尚未生成完成' },
        { status: 400 }
      );
    }

    // 解析请求体
    const body = await request.json();
    const { format = 'markdown' } = body;

    // 验证格式
    const validFormats: ExportFormat[] = ['markdown', 'word', 'pdf'];
    if (!validFormats.includes(format as ExportFormat)) {
      return NextResponse.json(
        { error: `不支持的导出格式: ${format}` },
        { status: 400 }
      );
    }

    // 解析报告内容
    const content = report.content as {
      title: string;
      summary?: string;
      sections?: Array<{ title: string; content: string }>;
    } | null;

    if (!content) {
      return NextResponse.json(
        { error: '报告内容为空' },
        { status: 400 }
      );
    }

    // 导出报告
    const result = await exportService.exportReport(
      {
        title: content.title || report.title,
        summary: content.summary,
        sections: content.sections,
      },
      format as ExportFormat,
      {
        filename: exportService.generateFilename(
          content.title || report.title,
          format as ExportFormat
        ),
      }
    );

    // 返回文件
    if (format === 'markdown') {
      return new NextResponse(result.data as string, {
        headers: {
          'Content-Type': result.contentType,
          'Content-Disposition': `attachment; filename="${result.filename}"`,
        },
      });
    } else {
      // Word/PDF 需要返回 Buffer
      return new NextResponse(Buffer.from(result.data as string), {
        headers: {
          'Content-Type': result.contentType,
          'Content-Disposition': `attachment; filename="${result.filename}"`,
        },
      });
    }
  } catch (error) {
    console.error('导出报告失败:', error);
    return NextResponse.json(
      { error: '导出报告失败' },
      { status: 500 }
    );
  }
}
