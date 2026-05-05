/**
 * 报告生成 API
 * POST - 触发报告生成工作流
 * 支持 SSE 流式状态更新
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/auth';
import { reportService } from '@/lib/reports/report-service';
import { citationService } from '@/lib/reports/citation-service';
import { createWorkflow, createStageUpdate, createCompleteUpdate, createErrorUpdate } from '@/lib/agent/workflow';
import { researchAgent } from '@/lib/agent/agents/research-agent';
import { retrievalAgent } from '@/lib/agent/agents/retrieval-agent';
import { analysisAgent, extractContentFromResearch } from '@/lib/agent/agents/analysis-agent';
import { writingAgent } from '@/lib/agent/agents/writing-agent';
import { templateService } from '@/lib/templates/template-service';
import { usageService } from '@/lib/usage/usage-service';

/**
 * POST /api/reports/[id]/generate
 * 触发报告生成
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

    // 更新状态为生成中
    await reportService.updateReportStatus(id, 'generating', userId);

    // 获取模板
    const template = await templateService.getTemplateById(report.templateId);
    if (!template) {
      throw new Error('模板不存在');
    }

    // 创建工作流
    const workflow = createWorkflow({
      reportId: id,
      topic: report.topic,
      templateId: report.templateId,
      projectId: report.projectId || undefined,
    });

    // 使用流式响应
    const stream = new ReadableStream({
      async start(controller) {
        let totalTokens = 0;

        try {
          // 阶段 1: Research Agent - 网页研究
          controller.enqueue(
            new TextEncoder().encode(
              createStageUpdate('researching', '正在搜索网页信息...', 10)
            )
          );

          workflow.transitionTo('researching', '正在搜索网页信息...');

          const researchResult = await researchAgent(report.topic, {
            maxSearchResults: 10,
            maxScrapeUrls: 5,
          });

          if (!researchResult.success || !researchResult.data) {
            console.warn('网页研究失败，继续执行:', researchResult.error);
          } else {
            workflow.context.researchResult = researchResult.data;
            controller.enqueue(
              new TextEncoder().encode(
                createStageUpdate(
                  'researching',
                  `网页研究完成，找到 ${researchResult.data.results.length} 个结果`,
                  25
                )
              )
            );
          }

          // 阶段 2: Retrieval Agent - 文档检索
          controller.enqueue(
            new TextEncoder().encode(
              createStageUpdate('retrieving', '正在检索文档内容...', 30)
            )
          );

          workflow.transitionTo('retrieving', '正在检索文档内容...');

          const retrievalResult = await retrievalAgent(report.topic, userId, {
            topK: 10,
            projectId: report.projectId || undefined,
          });

          if (!retrievalResult.success || !retrievalResult.data) {
            console.warn('文档检索失败，继续执行:', retrievalResult.error);
          } else {
            workflow.context.retrievalResult = retrievalResult.data;
            controller.enqueue(
              new TextEncoder().encode(
                createStageUpdate(
                  'retrieving',
                  `文档检索完成，找到 ${retrievalResult.data.chunks.length} 个相关片段`,
                  45
                )
              )
            );
          }

          // 阶段 3: Analysis Agent - 分析
          controller.enqueue(
            new TextEncoder().encode(
              createStageUpdate('analyzing', '正在分析内容，提取洞察...', 60)
            )
          );

          workflow.transitionTo('analyzing', '正在分析内容...');

          // 提取内容
          const webResults = workflow.context.researchResult?.scrapedContents || [];
          const docChunks = workflow.context.retrievalResult?.chunks || [];
          const { webContent, documentContent } = extractContentFromResearch(
            webResults,
            docChunks
          );

          const analysisResult = await analysisAgent(
            report.topic,
            webContent,
            documentContent
          );

          if (!analysisResult.success || !analysisResult.data) {
            throw new Error(analysisResult.error || '分析失败');
          }

          workflow.context.analysisResult = analysisResult.data;
          totalTokens += analysisResult.tokensUsed || 0;

          controller.enqueue(
            new TextEncoder().encode(
              createStageUpdate(
                'analyzing',
                `分析完成，提取 ${analysisResult.data.insights.length} 个洞察`,
                75
              )
            )
          );

          // 阶段 4: Writing Agent - 生成报告
          controller.enqueue(
            new TextEncoder().encode(
              createStageUpdate('writing', '正在生成报告内容...', 80)
            )
          );

          workflow.transitionTo('writing', '正在生成报告...');

          // 准备输入
          const templateStructure = {
            title: template.name,
            sections: ((template.structure as { sections?: Array<{ id: string; title: string; description: string; order?: number }> })
              .sections || []).map((s, i) => ({ ...s, order: s.order ?? i })),
          };

          const webSources = workflow.context.researchResult?.results.map(r => ({
            title: r.title,
            url: r.url,
            snippet: r.description,
          })) || [];

          const documentSources = workflow.context.retrievalResult?.chunks.map(c => ({
            title: c.documentTitle,
            snippet: c.content.substring(0, 200),
          })) || [];

          const writingResult = await writingAgent(
            {
              topic: report.topic,
              templateStructure,
              analysisResult: workflow.context.analysisResult,
              webSources,
              documentSources,
            }
          );

          if (!writingResult.success || !writingResult.data) {
            throw new Error(writingResult.error || '报告生成失败');
          }

          workflow.context.reportResult = writingResult.data;
          totalTokens += writingResult.tokensUsed || 0;

          // 保存报告内容
          await reportService.updateReportContent(
            id,
            writingResult.data as any,
            { sections: templateStructure.sections } as any,
            userId
          );

          // 保存引用
          await citationService.extractAndSaveCitations(
            id,
            writingResult.data.citations
          );

          // 更新 Token 使用量
          await reportService.addTokensUsed(id, totalTokens, userId);

          // 记录用量
          await usageService.recordUsage({
            userId,
            type: 'report',
            action: 'generate',
            tokensUsed: totalTokens,
            metadata: { reportId: id },
          });

          // 完成
          controller.enqueue(
            new TextEncoder().encode(
              createStageUpdate('writing', '报告生成完成', 100)
            )
          );

          workflow.transitionTo('completed', '报告生成完成');

          // 更新报告状态
          await reportService.updateReportStatus(id, 'completed', userId);

          controller.enqueue(new TextEncoder().encode(createCompleteUpdate()));
          controller.close();
        } catch (error) {
          console.error('报告生成失败:', error);

          // 更新状态为错误
          await reportService.updateReportStatus(id, 'error', userId).catch(() => {});

          controller.enqueue(
            new TextEncoder().encode(
              createErrorUpdate(error instanceof Error ? error.message : '报告生成失败')
            )
          );
          controller.close();
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('触发报告生成失败:', error);
    return NextResponse.json(
      { error: '触发报告生成失败' },
      { status: 500 }
    );
  }
}
