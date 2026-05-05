/**
 * 报告列表页面
 */

'use client';

import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreateReportDialog } from '@/components/CreateReportDialog';

interface Report {
  id: string;
  title: string;
  topic: string;
  status: string;
  createdAt: string;
  template: {
    name: string;
    category: string;
  };
  project?: {
    name: string;
  };
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  async function fetchReports() {
    setIsLoading(true);
    try {
      const response = await fetch('/api/reports');
      const data = await response.json();
      setReports(data.reports);
    } catch (error) {
      console.error('获取报告列表失败:', error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchReports();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline">草稿</Badge>;
      case 'generating':
        return <Badge variant="secondary">生成中</Badge>;
      case 'completed':
        return <Badge variant="default">已完成</Badge>;
      case 'error':
        return <Badge variant="destructive">错误</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">报告</h1>
          <p className="text-muted-foreground mt-1">
            管理你的研究报告和洞察
          </p>
        </div>

        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          新建报告
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">加载中...</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <h2 className="text-xl font-semibold mb-2">还没有报告</h2>
          <p className="text-muted-foreground mb-4">
            创建一个报告来开始你的研究工作。
          </p>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            创建第一个报告
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reports.map((report) => (
            <Card key={report.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="line-clamp-1">{report.title}</CardTitle>
                  {getStatusBadge(report.status)}
                </div>
                <CardDescription className="line-clamp-2">
                  {report.topic}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {new Date(report.createdAt).toLocaleDateString('zh-CN')}
                  </span>
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/dashboard/reports/${report.id}`}>
                      查看
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateReportDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </div>
  );
}
