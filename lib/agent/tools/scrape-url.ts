import * as cheerio from 'cheerio';
import { SearchResult } from './web-search';
import { scrapeCache, createScrapeCacheKey } from '../cache/search-cache';

export interface ScrapedContent {
  url: string;
  title: string;
  content: string;
  extractedAt: Date;
  wordCount: number;
}

/**
 * 抓取网页内容
 */
export async function scrapeUrl(url: string, options: {
  timeout?: number;
  maxContentLength?: number;
  includeImages?: boolean;
  includeLinks?: boolean;
  useCache?: boolean;
} = {}): Promise<ScrapedContent> {
  const {
    timeout = 10000,
    maxContentLength = 15000,
    includeImages = false,
    includeLinks = true,
    useCache = true,
  } = options;

  // 创建缓存键
  const cacheKey = createScrapeCacheKey(url);

  // 尝试从缓存获取
  if (useCache) {
    const cachedContent = scrapeCache.get<ScrapedContent>(cacheKey);
    if (cachedContent) {
      console.log(`从缓存获取页面内容: ${url}`);
      return cachedContent;
    }
  }

  // 创建 AbortController 用于超时控制（Next.js fetch 兼容）
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    // 检查 robots.txt
    const robotsUrl = new URL('/robots.txt', url).href;
    try {
      const robotsResponse = await fetch(robotsUrl, { signal: controller.signal });
      if (robotsResponse.ok) {
        const robotsTxt = await robotsResponse.text();
        if (robotsTxt.includes('Disallow: /')) {
          throw new Error('robots.txt 禁止抓取此页面');
        }
      }
    } catch (robotsError) {
      // robots.txt 检查失败时继续
      console.warn(`robots.txt 检查失败: ${robotsError}`);
    }

    // 获取页面内容
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // 提取标题
    const title = $('title').text().trim() || '无标题';

    // 移除不需要的元素
    $('script, style, noscript, iframe, nav, header, footer, aside, .ad, .advertisement').remove();

    // 提取主要内容
    let content = $('article').length ? $('article').first().html() : $('main').length ? $('main').first().html() : $('body').length ? $('body').first().html() : $('html').html();

    if (!content) {
      throw new Error('无法提取页面内容');
    }

    // 清洗内容
    content = cleanHtmlContent(content, { includeImages, includeLinks });

    // 截断内容
    if (content.length > maxContentLength) {
      content = content.substring(0, maxContentLength) + '...';
    }

    // 计算字数
    const wordCount = content.replace(/<[^>]*>/g, '').trim().split(/\s+/).length;

    // 缓存结果
    if (useCache) {
      scrapeCache.set(cacheKey, {
        url,
        title,
        content,
        extractedAt: new Date(),
        wordCount,
      });
    }

    return {
      url,
      title,
      content,
      extractedAt: new Date(),
      wordCount,
    };
  } catch (error) {
    console.error(`抓取 ${url} 失败:`, error);
    throw new Error(`抓取失败: ${error instanceof Error ? error.message : '未知错误'}`);
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * 清洗 HTML 内容
 */
function cleanHtmlContent(html: string, options: {
  includeImages?: boolean;
  includeLinks?: boolean;
}): string {
  const $ = cheerio.load(html);

  // 移除脚本和样式
  $('script, style').remove();

  // 移除不需要的标签
  $('button, input, textarea, form, select').remove();

  if (!options.includeImages) {
    $('img, picture, figure, svg').remove();
  }

  if (!options.includeLinks) {
    $('a').remove();
  }

  // 提取纯文本，保留基本格式
  let text = $.root().text();

  // 清理多余空格和换行
  text = text.replace(/\s+/g, ' ').trim();

  // 保留段落结构
  text = text.replace(/\n\s*\n/g, '\n\n');

  // 如果内容主要是图片且不需要图片，则返回空内容
  if (!options.includeImages) {
    const textLength = text.length;
    const tagCount = $('img').length + $('picture').length + $('figure').length + $('svg').length;

    if (textLength < 100 && tagCount > 0) {
      return '页面主要包含图片，不支持图片内容抓取';
    }
  }

  return text;
}

/**
 * 批量抓取多个网页
 */
export async function batchScrapeUrls(urls: string[], options: {
  timeout?: number;
  maxContentLength?: number;
  concurrency?: number;
} = {}): Promise<ScrapedContent[]> {
  const {
    timeout = 10000,
    maxContentLength = 15000,
    concurrency = 3,
  } = options;

  const results: ScrapedContent[] = [];
  const errors: string[] = [];

  // 控制并发数量
  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency);

    const batchPromises = batch.map(async (url) => {
      try {
        const result = await scrapeUrl(url, { timeout, maxContentLength });
        return result;
      } catch (error) {
        errors.push(`${url}: ${error instanceof Error ? error.message : '未知错误'}`);
        return null;
      }
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults.filter((r): r is ScrapedContent => r !== null));
  }

  if (errors.length > 0) {
    console.warn('批量抓取中的错误:', errors);
  }

  return results;
}