/**
 * Citation 服务层
 * 负责报告引用的管理
 */

import { prisma } from '@/lib/prisma';
import type { Citation } from '@/generated/prisma/client';
import type { Prisma } from '@/generated/prisma/client';

export interface CreateCitationInput {
  reportId: string;
  type: 'web' | 'document';
  sourceId: string;
  title: string;
  url?: string;
  snippet: string;
  position: number;
}

export interface GetCitationsOptions {
  reportId: string;
  type?: 'web' | 'document';
}

/**
 * Citation 服务类
 */
export class CitationService {
  /**
   * 创建引用
   */
  async createCitation(input: CreateCitationInput): Promise<Citation> {
    return prisma.citation.create({
      data: {
        reportId: input.reportId,
        type: input.type,
        sourceId: input.sourceId,
        title: input.title,
        url: input.url,
        snippet: input.snippet,
        position: input.position,
      },
    });
  }

  /**
   * 批量创建引用
   */
  async createCitations(
    reportId: string,
    citations: Omit<CreateCitationInput, 'reportId'>[]
  ): Promise<Citation[]> {
    const results: Citation[] = [];

    for (let i = 0; i < citations.length; i++) {
      const citation = await this.createCitation({
        ...citations[i],
        reportId,
        position: citations[i].position || i + 1,
      });
      results.push(citation);
    }

    return results;
  }

  /**
   * 获取报告的引用列表
   */
  async getCitations(options: GetCitationsOptions): Promise<Citation[]> {
    const { reportId, type } = options;

    const where: Record<string, unknown> = { reportId };
    if (type) {
      where.type = type;
    }

    return prisma.citation.findMany({
      where,
      orderBy: { position: 'asc' },
    });
  }

  /**
   * 获取引用数量
   */
  async getCitationCount(reportId: string, type?: 'web' | 'document'): Promise<number> {
    const where: Record<string, unknown> = { reportId };
    if (type) {
      where.type = type;
    }

    return prisma.citation.count({ where });
  }

  /**
   * 删除引用
   */
  async deleteCitation(id: string): Promise<Citation> {
    return prisma.citation.delete({ where: { id } });
  }

  /**
   * 删除报告的所有引用
   */
  async deleteCitationsByReportId(reportId: string): Promise<{ count: number }> {
    const result = await prisma.citation.deleteMany({
      where: { reportId },
    });

    return { count: result.count };
  }

  /**
   * 从报告结果中提取并创建引用
   */
  async extractAndSaveCitations(
    reportId: string,
    citations: Array<{
      id: string;
      type: 'web' | 'document';
      title: string;
      url?: string;
      snippet: string;
    }>
  ): Promise<Citation[]> {
    const citationInputs: Omit<CreateCitationInput, 'reportId'>[] = citations.map(
      (c, index) => ({
        type: c.type,
        sourceId: c.id,
        title: c.title,
        url: c.url,
        snippet: c.snippet,
        position: index + 1,
      })
    );

    return this.createCitations(reportId, citationInputs);
  }
}

// 导出单例
export const citationService = new CitationService();
