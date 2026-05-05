/**
 * 项目卡片组件
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, BarChart, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface ProjectCardProps {
  id: string;
  name: string;
  description?: string;
  color?: string;
  documentCount?: number;
  reportCount?: number;
  updatedAt: Date;
}

export function ProjectCard({
  id,
  name,
  description,
  color = '#3B82F6',
  documentCount = 0,
  reportCount = 0,
  updatedAt,
}: ProjectCardProps) {
  return (
    <Card className="group relative overflow-hidden hover:shadow-lg transition-shadow">
      <div
        className="absolute top-0 left-0 w-full h-1"
        style={{ backgroundColor: color }}
      />

      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{name}</CardTitle>
            {description && (
              <CardDescription className="mt-1 line-clamp-2">
                {description}
              </CardDescription>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            <span>{documentCount} 文档</span>
          </div>
          <div className="flex items-center gap-1">
            <BarChart className="h-4 w-4" />
            <span>{reportCount} 报告</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            更新于 {new Date(updatedAt).toLocaleDateString('zh-CN')}
          </span>

          <Button asChild variant="ghost" size="sm">
            <Link href={`/dashboard/projects/${id}`}>
              查看详情
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
