/**
 * Usage 服务层
 * 负责用量记录和统计
 */

import { prisma } from '@/lib/prisma';
import type { UsageLog } from '@/generated/prisma/client';
import type { Prisma } from '@/generated/prisma/client';

export interface RecordUsageInput {
  userId: string;
  type: 'report' | 'chat' | 'upload' | 'search';
  action: 'generate' | 'chat' | 'upload' | 'search';
  tokensUsed: number;
  metadata?: Record<string, unknown>;
}

export interface GetUsageStatsOptions {
  userId: string;
  startDate?: Date;
  endDate?: Date;
}

/**
 * Usage 服务类
 */
export class UsageService {
  /**
   * 记录用量
   */
  async recordUsage(input: RecordUsageInput): Promise<UsageLog> {
    return prisma.usageLog.create({
      data: {
        userId: input.userId,
        type: input.type,
        action: input.action,
        tokensUsed: input.tokensUsed,
        metadata: input.metadata as Prisma.InputJsonValue || {},
      },
    });
  }

  /**
   * 批量记录用量
   */
  async batchRecordUsages(inputs: RecordUsageInput[]): Promise<UsageLog[]> {
    const logs: UsageLog[] = [];
    for (const input of inputs) {
      const log = await this.recordUsage(input);
      logs.push(log);
    }
    return logs;
  }

  /**
   * 获取用量统计
   */
  async getUsageStats(options: GetUsageStatsOptions) {
    const { userId, startDate, endDate } = options;

    const where: Record<string, unknown> = { userId };

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) {
        (where.timestamp as Record<string, unknown>).gte = startDate;
      }
      if (endDate) {
        (where.timestamp as Record<string, unknown>).lte = endDate;
      }
    }

    const [totalTokens, totalRequests, byType, byAction] = await Promise.all([
      prisma.usageLog.aggregate({
        where,
        _sum: { tokensUsed: true },
      }),
      prisma.usageLog.count({ where }),
      prisma.usageLog.groupBy({
        by: ['type'],
        where,
        _sum: { tokensUsed: true },
        _count: true,
      }),
      prisma.usageLog.groupBy({
        by: ['action'],
        where,
        _sum: { tokensUsed: true },
        _count: true,
      }),
    ]);

    return {
      totalTokens: totalTokens._sum.tokensUsed || 0,
      totalRequests,
      byType: byType.reduce(
        (acc, item) => {
          acc[item.type] = {
            tokens: item._sum.tokensUsed || 0,
            count: item._count,
          };
          return acc;
        },
        {} as Record<string, { tokens: number; count: number }>
      ),
      byAction: byAction.reduce(
        (acc, item) => {
          acc[item.action] = {
            tokens: item._sum.tokensUsed || 0,
            count: item._count,
          };
          return acc;
        },
        {} as Record<string, { tokens: number; count: number }>
      ),
    };
  }

  /**
   * 获取用量历史
   */
  async getUsageHistory(
    userId: string,
    page: number = 1,
    limit: number = 20
  ) {
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.usageLog.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { timestamp: 'desc' },
      }),
      prisma.usageLog.count({ where: { userId } }),
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 检查用量限制
   */
  async checkUsageLimit(
    userId: string,
    plan: 'free' | 'pro' | 'team'
  ): Promise<{ allowed: boolean; remaining: number }> {
    // 定义各计划的限制
    const limits: Record<string, number> = {
      free: 100000, // 100k tokens/month
      pro: 1000000, // 1M tokens/month
      team: 5000000, // 5M tokens/month
    };

    const maxTokens = limits[plan] || limits.free;

    // 获取当前月用量
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const usage = await this.getUsageStats({
      userId,
      startDate: startOfMonth,
      endDate: endOfMonth,
    });

    const remaining = Math.max(0, maxTokens - usage.totalTokens);
    const allowed = remaining > 0;

    return { allowed, remaining };
  }
}

// 导出单例
export const usageService = new UsageService();
