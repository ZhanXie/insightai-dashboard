/**
 * Research Agent - 网页研究 Agent
 * 负责网页搜索和内容抓取
 */

import { webSearch } from '../tools/web-search';
import { scrapeUrl, ScrapedContent } from '../tools/scrape-url';
import { AgentResult, WebResearchResult, WebSearchResult, ScrapedContent as ScrapedContentData } from '../types';

export interface ResearchAgentOptions {
  maxSearchResults?: number;
  maxScrapeUrls?: number;
  maxContentLength?: number;
  timeout?: number;
}

/**
 * Research Agent - 执行网页研究
 */
export async function researchAgent(
  topic: string,
  options: ResearchAgentOptions = {}
): Promise<AgentResult<WebResearchResult>> {
  const {
    maxSearchResults = 10,
    maxScrapeUrls = 5,
    maxContentLength = 10000,
    timeout = 30000,
  } = options;

  try {
    // 步骤 1: 搜索相关信息
    console.log(`[Research Agent] 搜索主题: ${topic}`);
    const searchResults = await webSearch(topic, {
      maxResults: maxSearchResults,
      useCache: true,
    });

    if (searchResults.length === 0) {
      console.warn('[Research Agent] 未找到搜索结果');
      return {
        success: true,
        data: {
          query: topic,
          results: [],
          scrapedContents: [],
        },
      };
    }

    console.log(`[Research Agent] 找到 ${searchResults.length} 个搜索结果`);

    // 步骤 2: 抓取关键页面内容
    const urlsToScrape = searchResults
      .slice(0, maxScrapeUrls)
      .map(r => r.url);

    console.log(`[Research Agent] 准备抓取 ${urlsToScrape.length} 个页面`);

    const scrapedContents: ScrapedContent[] = [];

    for (const url of urlsToScrape) {
      try {
        const content = await scrapeUrl(url, {
          timeout,
          maxContentLength,
          useCache: true,
        });
        scrapedContents.push({
          url: content.url,
          title: content.title,
          content: content.content,
          extractedAt: new Date(),
          wordCount: content.wordCount || 0,
        });
        console.log(`[Research Agent] 成功抓取: ${url}`);
      } catch (error) {
        console.warn(`[Research Agent] 抓取失败 ${url}:`, error);
        // 继续抓取其他页面
      }
    }

    console.log(`[Research Agent] 研究完成，抓取 ${scrapedContents.length} 个页面内容`);

    return {
      success: true,
      data: {
        query: topic,
        results: searchResults.map(r => ({
          title: r.title,
          url: r.url,
          description: r.description,
        })),
        scrapedContents,
      },
    };
  } catch (error) {
    console.error('[Research Agent] 研究失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '研究失败',
    };
  }
}

/**
 * 搜索建议查询
 */
export function generateResearchQueries(topic: string): string[] {
  // 生成多个搜索查询以获取更全面的覆盖
  return [
    topic,
    `${topic} 分析`,
    `${topic} 趋势`,
    `${topic} 报告`,
    `${topic} 最新进展`,
  ];
}

/**
 * 批量研究多个主题
 */
export async function batchResearch(
  topics: string[],
  options?: ResearchAgentOptions
): Promise<AgentResult<WebResearchResult[]>> {
  const results: WebResearchResult[] = [];
  let totalTokens = 0;

  for (const topic of topics) {
    const result = await researchAgent(topic, options);
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
