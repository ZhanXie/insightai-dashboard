/**
 * 内存缓存接口
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

/**
 * 内存缓存实现
 */
export class InMemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize = 1000; // 最大缓存条目数
  private defaultTTL = 3600000; // 默认缓存时间（1小时）

  /**
   * 设置缓存
   */
  set<T>(key: string, data: T, ttl?: number): void {
    if (this.cache.size >= this.maxSize) {
      // 删除最旧的条目
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    });
  }

  /**
   * 获取缓存
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // 检查是否过期
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * 删除缓存
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 获取缓存大小
   */
  size(): number {
    return this.cache.size;
  }
}

/**
 * 创建搜索缓存键
 */
export function createSearchCacheKey(query: string, options: {
  maxResults?: number;
  safeSearch?: string;
  region?: string;
  time?: string;
  domains?: string[];
} = {}): string {
  const { maxResults, safeSearch, region, time, domains } = options;

  const parts = [
    query,
    maxResults || '10',
    safeSearch || 'moderate',
    region || 'us-en',
    time || '',
    domains ? domains.join(',') : '',
  ];

  return `search:${parts.join(':')}`;
}

/**
 * 创建页面抓取缓存键
 */
export function createScrapeCacheKey(url: string): string {
  return `scrape:${url}`;
}

// 导出全局缓存实例
export const searchCache = new InMemoryCache();
export const scrapeCache = new InMemoryCache();