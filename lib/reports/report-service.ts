/**
 * Report 服务层
 * 负责报告的 CRUD 操作
 */

import { prisma } from '@/lib/prisma';
import type { Report, Template } from '@/generated/prisma/client';
import type { Prisma } from '@/generated/prisma/client';

export interface CreateReportInput {
  userId: string;
  topic: string;
  templateId: string;
  projectId?: string;
  title?: string;
}

export interface UpdateReportInput {
  title?: string;
  topic?: string;
  status?: string;
  outline?: Prisma.InputJsonValue;
  content?: Prisma.InputJsonValue;
  tokensUsed?: number;
}

export interface GetReportsOptions {
  userId: string;
  page?: number;
  limit?: number;
  status?: string;
  projectId?: string;
}

/**
 * Report 服务类
 */
export class ReportService {
  /**
   * 创建报告（草稿）
   */
  async createReport(input: CreateReportInput): Promise<Report> {
    const title = input.title || input.topic;

    return prisma.report.create({
      data: {
        userId: input.userId,
        topic: input.topic,
        title,
        templateId: input.templateId,
        projectId: input.projectId,
        status: 'draft',
      },
    });
  }

  /**
   * 获取用户的报告列表（分页、过滤）
   */
  async getReports(options: GetReportsOptions) {
    const {
      userId,
      page = 1,
      limit = 10,
      status,
      projectId,
    } = options;

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { userId };
    if (status) {
      where.status = status;
    }
    if (projectId) {
      where.projectId = projectId;
    }

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          template: {
            select: {
              id: true,
              name: true,
              slug: true,
              category: true,
            },
          },
          project: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              citations: true,
            },
          },
        },
      }),
      prisma.report.count({ where }),
    ]);

    return {
      reports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 获取报告详情
   */
  async getReportById(id: string, userId?: string) {
    const where: Prisma.ReportWhereUniqueInput = { id };
    if (userId) {
      // Prisma doesn't strictly support dynamic where without exact types, so we cast it.
      (where as any).userId = userId;
    }

    return prisma.report.findUnique({
      where,
      include: {
        template: true,
        project: true,
        citations: {
          orderBy: { position: 'asc' },
        },
      },
    });
  }

  /**
   * 更新报告
   */
  async updateReport(id: string, data: UpdateReportInput, _userId?: string): Promise<Report> {
    return prisma.report.update({
      where: { id },
      data,
    });
  }

  /**
   * 删除报告
   */
  async deleteReport(id: string, _userId?: string): Promise<Report> {
    return prisma.report.delete({
      where: { id },
    });
  }

  /**
   * 更新报告状态
   */
  async updateReportStatus(
    id: string,
    status: string,
    _userId?: string
  ): Promise<Report> {
    return this.updateReport(id, { status }, _userId);
  }

  /**
   * 更新报告内容
   */
  async updateReportContent(
    id: string,
    content: Prisma.InputJsonValue,
    outline?: Prisma.InputJsonValue,
    _userId?: string
  ): Promise<Report> {
    return this.updateReport(
      id,
      {
        content,
        ...(outline && { outline }),
      },
      _userId
    );
  }

  /**
   * 累加 Token 使用量
   */
  async addTokensUsed(id: string, tokens: number, _userId?: string): Promise<Report> {
    const report = await this.getReportById(id, _userId);
    if (!report) {
      throw new Error('报告不存在');
    }

    return this.updateReport(
      id,
      { tokensUsed: report.tokensUsed + tokens },
      _userId
    );
  }

  /**
   * 获取用户报告统计
   */
  async getReportStats(userId: string) {
    const [total, byStatus] = await Promise.all([
      prisma.report.count({ where: { userId } }),
      prisma.report.groupBy({
        by: ['status'],
        where: { userId },
        _count: true,
      }),
    ]);

    const statusCounts = byStatus.reduce(
      (acc, item) => {
        acc[item.status] = item._count;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      total,
      byStatus: statusCounts,
    };
  }
}

// 导出单例
export const reportService = new ReportService();
