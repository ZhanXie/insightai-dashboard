/**
 * Analysis Agent - 分析 Agent
 * 负责洞察提取和图表数据生成
 */

import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { AgentResult, AnalysisResult, Insight, ChartData } from '../types';
import { AnalysisResultSchema } from '../schemas/report-schema';

export interface AnalysisAgentOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

/**
 * Analysis Agent - 执行数据分析
 */
export async function analysisAgent(
  topic: string,
  webContent: string,
  documentContent: string,
  options: AnalysisAgentOptions = {}
): Promise<AgentResult<AnalysisResult>> {
  const {
    model = 'gpt-4o',
    maxTokens = 4000,
    temperature = 0.3,
  } = options;

  try {
    console.log('[Analysis Agent] 开始分析内容...');

    // 准备分析提示
    const prompt = `
你是一个专业的数据分析助手。请基于以下提供的研究内容，提取关键洞察并生成适合可视化的数据。

**研究主题**: ${topic}

**网页研究内容**:
${webContent || '无网页研究内容'}

**文档检索内容**:
${documentContent || '无文档检索内容'}

**任务**:
1. 提取 3-5 个关键洞察（insights），每个洞察包括：
   - id: 唯一标识符（insight-1, insight-2, ...）
   - title: 洞察标题
   - description: 详细描述
   - confidence: 置信度（0-1）
   - sources: 引用来源 ID 列表

2. 生成 1-3 个图表数据（charts），适合以下类型之一：
   - bar: 柱状图
   - line: 折线图
   - pie: 饼图
   - table: 表格
   每个图表包括：
   - id: 唯一标识符
   - type: 图表类型
   - title: 图表标题
   - data: 图表数据（JSON 格式）

3. 生成一段内容摘要（summary），总结关键发现（200-300 字）

请严格按照以下 JSON 格式返回：
{
  "insights": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "confidence": 0.85,
      "sources": ["source-id-1"]
    }
  ],
  "charts": [
    {
      "id": "string",
      "type": "bar|line|pie|table",
      "title": "string",
      "data": {}
    }
  ],
  "summary": "string"
}
`;

    // 调用 LLM 进行分析
    const { object } = await generateObject({
      model: openai(model),
      schema: AnalysisResultSchema,
      prompt,
      maxTokens,
      temperature,
    });

    console.log('[Analysis Agent] 分析完成');
    console.log(`[Analysis Agent] 提取 ${object.insights.length} 个洞察，${object.charts.length} 个图表`);

    // 估算 Token 使用量
    const tokensUsed = Math.ceil(prompt.length / 4) + Math.ceil(JSON.stringify(object).length / 4);

    return {
      success: true,
      data: object as AnalysisResult,
      tokensUsed,
    };
  } catch (error) {
    console.error('[Analysis Agent] 分析失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '分析失败',
    };
  }
}

/**
 * 从研究结果中提取内容
 */
export function extractContentFromResearch(
  webResults: Array<{ title: string; content: string }>,
  documentChunks: Array<{ documentTitle: string; content: string }>
): { webContent: string; documentContent: string } {
  // 提取网页内容
  const webContent = webResults
    .slice(0, 5)
    .map(r => `## ${r.title}\n\n${r.content}`)
    .join('\n\n---\n\n');

  // 提取文档内容
  const documentContent = documentChunks
    .slice(0, 10)
    .map(chunk => `## ${chunk.documentTitle}\n\n${chunk.content}`)
    .join('\n\n---\n\n');

  return { webContent, documentContent };
}

/**
 * 格式化分析结果为可读文本
 */
export function formatAnalysisResult(result: AnalysisResult): string {
  let output = '# 分析结果\n\n';

  // 摘要
  output += `## 摘要\n\n${result.summary}\n\n`;

  // 洞察
  output += `## 关键洞察\n\n`;
  result.insights.forEach(insight => {
    output += `### ${insight.title}\n`;
    output += `${insight.description}\n`;
    output += `置信度: ${(insight.confidence * 100).toFixed(0)}%\n\n`;
  });

  // 图表
  output += `## 图表数据\n\n`;
  result.charts.forEach(chart => {
    output += `### ${chart.title} (${chart.type})\n`;
    output += `\`\`\`json\n${JSON.stringify(chart.data, null, 2)}\n\`\`\`\n\n`;
  });

  return output;
}
