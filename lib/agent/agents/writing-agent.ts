/**
 * Writing Agent - 写作 Agent
 * 负责结构化报告生成
 */

import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { AgentResult, ReportResult, Citation, ReportSection } from '../types';
import { ReportResultSchema } from '../schemas/report-schema';

export interface WritingAgentOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  language?: 'zh-CN' | 'en-US';
}

export interface WritingAgentInput {
  topic: string;
  templateStructure: TemplateStructure;
  analysisResult: {
    insights: Array<{ title: string; description: string; confidence: number }>;
    charts: Array<{ id: string; type: string; title: string; data: unknown }>;
    summary: string;
  };
  webSources: Array<{ title: string; url: string; snippet: string }>;
  documentSources: Array<{ title: string; snippet: string }>;
}

export interface TemplateStructure {
  title: string;
  sections: Array<{
    id: string;
    title: string;
    description: string;
    order: number;
  }>;
}

/**
 * Writing Agent - 生成结构化报告
 */
export async function writingAgent(
  input: WritingAgentInput,
  options: WritingAgentOptions = {}
): Promise<AgentResult<ReportResult>> {
  const {
    model = 'gpt-4o',
    maxTokens = 8000,
    temperature = 0.5,
    language = 'zh-CN',
  } = options;

  try {
    console.log('[Writing Agent] 开始生成报告...');

    // 构建引用列表
    const citations: Citation[] = [];
    let citationIndex = 1;

    // 添加网页来源
    input.webSources.forEach(source => {
      citations.push({
        id: `web-${citationIndex}`,
        type: 'web',
        title: source.title,
        url: source.url,
        snippet: source.snippet,
      });
      citationIndex++;
    });

    // 添加文档来源
    input.documentSources.forEach(source => {
      citations.push({
        id: `doc-${citationIndex}`,
        type: 'document',
        title: source.title,
        snippet: source.snippet,
      });
      citationIndex++;
    });

    // 准备写作提示
    const prompt = `
你是一个专业的报告撰写助手。请基于以下提供的分析结果和参考资料，撰写一份结构化的专业报告。

**报告主题**: ${input.topic}
**语言**: ${language === 'zh-CN' ? '中文' : 'English'}

**模板结构**:
${input.templateStructure.sections.map(s => `- ${s.title}: ${s.description}`).join('\n')}

**分析结果摘要**:
${input.analysisResult.summary}

**关键洞察**:
${input.analysisResult.insights.map(i => `- ${i.title}: ${i.description}`).join('\n')}

**参考资料**:

${citations.map(c => `[${c.id}] ${c.title}${c.url ? ` (${c.url})` : ''}\n${c.snippet}`).join('\n\n')}

**任务**:
请按照模板结构生成完整的报告，要求：

1. **标题**: 生成一个吸引人的报告标题
2. **摘要**: 100-200 字的报告摘要
3. **章节**: 按照模板结构生成每个章节的内容
   - 每个章节包括 id, title, content, citations
   - content 使用 Markdown 格式
   - citations 是该章节引用的来源 ID 列表
4. **引用**: 列出所有引用的来源（已在上面提供）

请严格按照以下 JSON 格式返回：
{
  "title": "string",
  "summary": "string",
  "sections": [
    {
      "id": "string",
      "title": "string",
      "content": "string (Markdown format)",
      "citations": ["citation-id-1", "citation-id-2"]
    }
  ],
  "citations": [
    {
      "id": "string",
      "type": "web|document",
      "title": "string",
      "url": "string (optional)",
      "snippet": "string"
    }
  ]
}
`;

    // 调用 LLM 生成报告
    const { object } = await generateObject({
      model: openai(model),
      schema: ReportResultSchema,
      prompt,
      maxTokens,
      temperature,
    });

    console.log('[Writing Agent] 报告生成完成');
    console.log(`[Writing Agent] 生成 ${object.sections.length} 个章节，${object.citations.length} 个引用`);

    // 估算 Token 使用量
    const tokensUsed = Math.ceil(prompt.length / 4) + Math.ceil(JSON.stringify(object).length / 4);

    return {
      success: true,
      data: object as ReportResult,
      tokensUsed,
    };
  } catch (error) {
    console.error('[Writing Agent] 报告生成失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '报告生成失败',
    };
  }
}

/**
 * 将报告结果转换为 Markdown 格式
 */
export function reportToMarkdown(report: ReportResult): string {
  let markdown = `# ${report.title}\n\n`;
  markdown += `> ${report.summary}\n\n`;

  // 章节
  report.sections.forEach(section => {
    markdown += `## ${section.title}\n\n`;
    markdown += `${section.content}\n\n`;

    // 引用标记
    if (section.citations.length > 0) {
      markdown += `**引用**: ${section.citations.join(', ')}\n\n`;
    }
  });

  // 引用列表
  if (report.citations.length > 0) {
    markdown += `---\n\n## 参考文献\n\n`;
    report.citations.forEach(citation => {
      const type = citation.type === 'web' ? '[网页]' : '[文档]';
      markdown += `- ${type} **${citation.title}**`;
      if (citation.url) {
        markdown += `: ${citation.url}`;
      }
      markdown += `\n  > ${citation.snippet}\n\n`;
    });
  }

  return markdown;
}

/**
 * 从报告结果中提取纯文本（去除 Markdown）
 */
export function reportToPlainText(report: ReportResult): string {
  let text = `${report.title}\n\n`;
  text += `${report.summary}\n\n`;

  report.sections.forEach(section => {
    text += `${section.title}\n`;
    // 移除 Markdown 标记
    const plainContent = section.content
      .replace(/#{1,6}\s/g, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`([^`]+)`/g, '$1');
    text += `${plainContent}\n\n`;
  });

  return text;
}
