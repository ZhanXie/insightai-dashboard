/**
 * 报告生成 Zod Schema
 */

import { z } from 'zod';

/**
 * 引用 Schema
 */
export const CitationSchema = z.object({
  id: z.string(),
  type: z.enum(['web', 'document']),
  title: z.string(),
  url: z.string().optional(),
  snippet: z.string(),
});

export type CitationInput = z.infer<typeof CitationSchema>;

/**
 * 报告部分 Schema
 */
export const ReportSectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  citations: z.array(z.string()), // citation IDs
});

export type ReportSectionInput = z.infer<typeof ReportSectionSchema>;

/**
 * 图表数据 Schema
 */
export const ChartDataSchema = z.object({
  id: z.string(),
  type: z.enum(['bar', 'line', 'pie', 'table']),
  title: z.string(),
  data: z.record(z.unknown()),
});

export type ChartDataInput = z.infer<typeof ChartDataSchema>;

/**
 * 洞察 Schema
 */
export const InsightSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  confidence: z.number().min(0).max(1),
  sources: z.array(z.string()), // citation IDs
});

export type InsightInput = z.infer<typeof InsightSchema>;

/**
 * 分析结果 Schema
 */
export const AnalysisResultSchema = z.object({
  insights: z.array(InsightSchema),
  charts: z.array(ChartDataSchema),
  summary: z.string(),
});

export type AnalysisResultInput = z.infer<typeof AnalysisResultSchema>;

/**
 * 报告结果 Schema
 */
export const ReportResultSchema = z.object({
  title: z.string(),
  summary: z.string(),
  sections: z.array(ReportSectionSchema),
  citations: z.array(CitationSchema),
});

export type ReportResultInput = z.infer<typeof ReportResultSchema>;

/**
 * 报告生成配置 Schema
 */
export const ReportGenerationConfigSchema = z.object({
  topic: z.string().min(1).max(200),
  templateId: z.string(),
  projectId: z.string().optional(),
  language: z.enum(['zh-CN', 'en-US']).default('zh-CN'),
  maxLength: z.number().min(1000).max(50000).default(15000),
  includeCharts: z.boolean().default(true),
  citationStyle: z.enum(['numeric', 'author-date']).default('numeric'),
});

export type ReportGenerationConfigInput = z.infer<typeof ReportGenerationConfigSchema>;

/**
 * 工作流阶段 Schema
 */
export const WorkflowStageSchema = z.object({
  stage: z.enum(['research', 'retrieval', 'analysis', 'writing']),
  status: z.enum(['pending', 'in-progress', 'completed', 'error']),
  message: z.string(),
  progress: z.number().min(0).max(100).default(0),
  startedAt: z.string().optional(),
  completedAt: z.string().optional(),
  error: z.string().optional(),
});

export type WorkflowStageInput = z.infer<typeof WorkflowStageSchema>;

/**
 * 验证报告生成配置
 */
export function validateReportConfig(config: unknown): ReportGenerationConfigInput {
  return ReportGenerationConfigSchema.parse(config);
}

/**
 * 验证报告结果
 */
export function validateReportResult(result: unknown): ReportResultInput {
  return ReportResultSchema.parse(result);
}
