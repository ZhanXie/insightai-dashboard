/**
 * 用量统计展示组件
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, BarChart, Search } from 'lucide-react';

interface UsageStats {
  totalTokens: number;
  totalRequests: number;
  byType: Record<string, { tokens: number; count: number }>;
}

interface UsageOverviewProps {
  stats: UsageStats | null;
  isLoading?: boolean;
}

export function UsageOverview({ stats, isLoading }: UsageOverviewProps) {
  if (isLoading) {
    return <div className="flex items-center justify-center h-48">加载中...</div>;
  }

  if (!stats) {
    return null;
  }

  const formatTokens = (tokens: number) => {
    if (tokens >= 1000000) {
      return `${(tokens / 1000000).toFixed(1)}M`;
    }
    if (tokens >= 1000) {
      return `${(tokens / 1000).toFixed(1)}K`;
    }
    return tokens.toString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>用量统计</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
            <FileText className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-sm text-muted-foreground">报告生成</p>
              <p className="text-lg font-semibold">
                {formatTokens(stats.byType.report?.tokens || 0)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
            <Search className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-sm text-muted-foreground">搜索请求</p>
              <p className="text-lg font-semibold">
                {formatTokens(stats.byType.search?.tokens || 0)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
            <BarChart className="h-5 w-5 text-purple-500" />
            <div>
              <p className="text-sm text-muted-foreground">总请求数</p>
              <p className="text-lg font-semibold">{stats.totalRequests}</p>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-sm text-muted-foreground">
            本月总 Token 消耗：<span className="font-semibold">{formatTokens(stats.totalTokens)}</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
