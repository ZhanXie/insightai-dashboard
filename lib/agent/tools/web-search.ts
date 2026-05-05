// @ts-ignore duckduckgo-search types are missing
import { search } from 'duckduckgo-search';
import { searchCache, createSearchCacheKey } from '../cache/search-cache';

export interface SearchResult {
  title: string;
  url: string;
  description: string;
  favicon: string;
}

/**
 * 使用 DuckDuckGo 搜索相关信息
 */
export async function webSearch(query: string, options: {
  maxResults?: number;
  safeSearch?: 'off' | 'moderate' | 'strict';
  region?: string;
  time?: 'd' | 'w' | 'm' | 'y';
  useCache?: boolean;
} = {}): Promise<SearchResult[]> {
  const {
    maxResults = 10,
    safeSearch = 'moderate',
    region = 'us-en',
    time,
    useCache = true,
  } = options;

  // 创建缓存键
  const cacheKey = createSearchCacheKey(query, { maxResults, safeSearch, region, time });

  // 尝试从缓存获取
  if (useCache) {
    const cachedResults = searchCache.get<SearchResult[]>(cacheKey);
    if (cachedResults) {
      console.log(`从缓存获取搜索结果: ${query}`);
      return cachedResults;
    }
  }

  try {
    const response = await search({
      query,
      maxResults,
      safeSearch,
      region,
      ...(time && { time }),
    });

    const results = response.results.map((result: any) => ({
      title: result.title || '无标题',
      url: result.href || '',
      description: result.body || '无描述',
      favicon: result.favicon || '',
    }));

    // 缓存结果
    if (useCache) {
      searchCache.set(cacheKey, results);
    }

    return results;
  } catch (error) {
    console.error('DuckDuckGo 搜索错误:', error);
    throw new Error(`搜索失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 搜索并返回相关的链接用于后续抓取
 */
export async function webSearchWithFilter(
  query: string,
  options: {
    maxResults?: number;
    domains?: string[];
    excludeDomains?: string[];
    useCache?: boolean;
  } = {}
): Promise<SearchResult[]> {
  const {
    maxResults = 10,
    domains,
    excludeDomains,
    useCache = true,
  } = options;

  let searchQuery = query;

  if (domains && domains.length > 0) {
    searchQuery = `${query} site:${domains.join(' OR site:')}`;
  }

  if (excludeDomains && excludeDomains.length > 0) {
    searchQuery += ` -${excludeDomains.map(d => `site:${d}`).join(' -')}`;
  }

  return await webSearch(searchQuery, { maxResults, useCache });
}