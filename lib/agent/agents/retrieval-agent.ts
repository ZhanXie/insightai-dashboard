/**
 * Retrieval Agent - 文档检索 Agent
 * 负责从用户文档中检索相关信息
 */

import { prisma } from '@/lib/prisma';
import { hybridSearch, SearchResultChunk } from '@/lib/vector-search';
import { AgentResult, RetrievalResult, DocumentChunk } from '../types';

export interface RetrievalAgentOptions {
  topK?: number;
  projectId?: string;
  useMMR?: boolean;
}

/**
 * 生成查询嵌入向量（使用 OpenAI API）
 */
async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: text,
      model: 'text-embedding-3-small',
      dimensions: 1536,
    }),
  });

  if (!response.ok) {
    throw new Error(`生成嵌入向量失败: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

/**
 * Retrieval Agent - 执行文档检索
 */
export async function retrievalAgent(
  query: string,
  userId: string,
  options: RetrievalAgentOptions = {}
): Promise<AgentResult<RetrievalResult>> {
  const {
    topK = 10,
    projectId,
    useMMR = true,
  } = options;

  try {
    // 获取项目下的文档 ID（如果指定了项目）
    let documentIds: string[] | undefined;

    if (projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          documents: {
            where: { status: 'ready' },
            select: { id: true },
          },
        },
      });

      if (project) {
        documentIds = project.documents.map(d => d.id);
      }
    }

    console.log(`[Retrieval Agent] 查询: ${query}`);
    console.log(`[Retrieval Agent] 文档范围: ${documentIds ? documentIds.length + ' 个文档' : '所有文档'}`);

    // 生成查询嵌入向量
    const queryEmbedding = await generateEmbedding(query);

    // 执行混合搜索（向量 + 关键词）
    const chunks = await hybridSearch(userId, queryEmbedding, query, {
      topK,
      documentIds,
      useMMR,
    });

    console.log(`[Retrieval Agent] 检索到 ${chunks.length} 个相关文档块`);

    // 转换为标准格式
    const documentChunks: DocumentChunk[] = chunks.map((chunk, index) => ({
      id: chunk.id,
      documentId: '', // 需要从文档信息获取
      documentTitle: chunk.documentFilename,
      content: chunk.content,
      score: 1 / (index + 1), // 简单的相关性分数
    }));

    return {
      success: true,
      data: {
        projectId,
        chunks: documentChunks,
        totalSearched: documentIds?.length || 0,
        totalRetrieved: documentChunks.length,
      },
    };
  } catch (error) {
    console.error('[Retrieval Agent] 检索失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '检索失败',
    };
  }
}

/**
 * 批量检索多个查询
 */
export async function batchRetrieval(
  queries: string[],
  userId: string,
  options?: RetrievalAgentOptions
): Promise<AgentResult<RetrievalResult[]>> {
  const results: RetrievalResult[] = [];
  let totalTokens = 0;

  for (const query of queries) {
    const result = await retrievalAgent(query, userId, options);
    if (result.success && result.data) {
      results.push(result.data);
    }
  }

  return {
    success: true,
    data: results,
    tokensUsed: totalTokens,
  };
}

/**
 * 从检索结果中提取摘要
 */
export function extractRetrievalSummary(result: RetrievalResult): string {
  if (result.chunks.length === 0) {
    return '未找到相关文档内容';
  }

  const sources = result.chunks
    .slice(0, 3)
    .map(chunk => `- ${chunk.documentTitle}`)
    .join('\n');

  return `从 ${result.totalRetrieved} 个文档块中检索到相关内容：\n${sources}`;
}
