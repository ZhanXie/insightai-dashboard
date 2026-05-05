/**
 * 项目统计组件
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, BarChart, Clock } from 'lucide-react';

interface ProjectStatsProps {
  projectCount: number;
  documentCount: number;
  reportCount: number;
}

export function ProjectStats({ projectCount, documentCount, reportCount }: ProjectStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">项目总数</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{projectCount}</div>
          <p className="text-xs text-muted-foreground">知识库数量</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">文档总数</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{documentCount}</div>
          <p className="text-xs text-muted-foreground">已上传文档</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">报告总数</CardTitle>
          <BarChart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{reportCount}</div>
          <p className="text-xs text-muted-foreground">已生成报告</p>
        </CardContent>
      </Card>
    </div>
  );
}
