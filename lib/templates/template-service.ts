/**
 * Template 服务层
 * 负责报告模板的管理
 */

import { prisma } from '@/lib/prisma';
import type { Template } from '@/generated/prisma/client';
import type { Prisma } from '@/generated/prisma/client';

export interface GetTemplatesOptions {
  category?: 'business' | 'academic' | 'technical' | 'general';
  isPublic?: boolean;
  page?: number;
  limit?: number;
}

/**
 * Template 服务类
 */
export class TemplateService {
  /**
   * 获取模板列表
   */
  async getTemplates(options: GetTemplatesOptions = {}) {
    const {
      category,
      isPublic = true,
      page = 1,
      limit = 20,
    } = options;

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (category) {
      where.category = category;
    }
    if (isPublic !== undefined) {
      where.isPublic = isPublic;
    }

    const [templates, total] = await Promise.all([
      prisma.template.findMany({
        where,
        skip,
        take: limit,
        orderBy: { usageCount: 'desc' },
      }),
      prisma.template.count({ where }),
    ]);

    return {
      templates,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 根据 Slug 获取模板
   */
  async getTemplateBySlug(slug: string): Promise<Template | null> {
    return prisma.template.findUnique({
      where: { slug },
    });
  }

  /**
   * 根据 ID 获取模板
   */
  async getTemplateById(id: string): Promise<Template | null> {
    return prisma.template.findUnique({
      where: { id },
    });
  }

  /**
   * 增加模板使用次数
   */
  async incrementUsage(id: string): Promise<Template> {
    return prisma.template.update({
      where: { id },
      data: {
        usageCount: {
          increment: 1,
        },
      },
    });
  }

  /**
   * 获取热门模板
   */
  async getPopularTemplates(limit: number = 5): Promise<Template[]> {
    return prisma.template.findMany({
      where: { isPublic: true },
      orderBy: { usageCount: 'desc' },
      take: limit,
    });
  }
}

// 导出单例
export const templateService = new TemplateService();
