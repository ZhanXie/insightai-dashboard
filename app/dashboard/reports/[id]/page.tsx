/**
 * 报告详情页面
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Play, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ReportProgress } from '@/components/ReportProgress';
import { ReportSection } from '@/components/ReportSection';
import { CitationList } from '@/components/CitationList';
import { ExportButton } from '@/components/ExportButton';

interface Report {
  id: string;
  title: string;
  topic: string;
  status: string;
  content: {
    title: string;
    summary: string;
    sections: Array<{ id: string; title: string; content: string }>;
  } | null;
  citations: Array<{
    id: string;
    type: 'web' | 'document';
    title: string;
    url?: string;
    snippet: string;
  }>;
  template: {
    name: string;
    category: string;
  };
}

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [report, setReport] = useState<Report | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchReport() {
      try {
        const response = await fetch(`/api/reports/${params.id}`);
        if (!response.ok) {
          router.push('/dashboard/reports');
          return;
        }
        const data = await response.json();
        setReport(data);
      } catch (error) {
        console.error('获取报告详情失败:', error);
      } finally {
        setIsLoading(false);
      }
    }

    if (params.id) {
      fetchReport();
    }
  }, [params.id, router]);

  async function handleGenerate() {
    setIsGenerating(true);
    try {
      const response = await fetch(`/api/reports/${params.id}/generate`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('生成失败');
      }
    } catch (error) {
      console.error('生成报告失败:', error);
    }
  }

  async function handleDelete() {
    if (!confirm('确定要删除这个报告吗？')) {
      return;
    }

    try {
      await fetch(`/api/reports/${params.id}`, { method: 'DELETE' });
      router.push('/dashboard/reports');
    } catch (error) {
      console.error('删除报告失败:', error);
    }
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">加载中...</div>;
  }

  if (!report) {
    return null;
  }

  const getStatusBadge = () => {
    switch (report.status) {
      case 'draft':
        return <Badge variant="outline">草稿</Badge>;
      case 'generating':
        return <Badge variant="secondary">生成中</Badge>;
      case 'completed':
        return <Badge variant="default">已完成</Badge>;
      case 'error':
        return <Badge variant="destructive">错误</Badge>;
      default:
        return <Badge>{report.status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/reports">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{report.title}</h1>
            <p className="text-muted-foreground mt-1">{report.topic}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {getStatusBadge()}
          {report.status === 'draft' && (
            <Button onClick={handleGenerate} disabled={isGenerating}>
              <Play className="h-4 w-4 mr-2" />
              开始生成
            </Button>
          )}
          {report.status === 'completed' && (
            <ExportButton reportId={report.id} title={report.title} />
          )}
          <Button variant="outline" size="icon" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 生成进度 */}
      {report.status === 'generating' && (
        <ReportProgress
          reportId={report.id}
          onComplete={() => {
            // 刷新页面
            window.location.reload();
          }}
        />
      )}

      {/* 报告内容 */}
      {report.status === 'completed' && report.content && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>摘要</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{report.content.summary}</p>
            </CardContent>
          </Card>

          {report.content.sections.map((section) => (
            <Card key={section.id}>
              <CardHeader>
                <CardTitle>{section.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <ReportSection title={section.title} content={section.content} />
              </CardContent>
            </Card>
          ))}

          {report.citations.length > 0 && (
            <CitationList citations={report.citations} />
          )}
        </div>
      )}

      {report.status === 'error' && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">报告生成过程中出现错误，请重试。</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
