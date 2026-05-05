/**
 * 模板 API
 * GET - 获取模板列表
 */

import { NextRequest, NextResponse } from 'next/server';
import { templateService } from '@/lib/templates/template-service';

/**
 * GET /api/templates
 * 获取报告模板列表
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const category = searchParams.get('category') as
      | 'business'
      | 'academic'
      | 'technical'
      | 'general'
      | undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const result = await templateService.getTemplates({
      category,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('获取模板列表失败:', error);
    return NextResponse.json(
      { error: '获取模板列表失败' },
      { status: 500 }
    );
  }
}
