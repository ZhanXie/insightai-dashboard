/**
 * 项目详情页面
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, FileText, Plus } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Project {
  id: string;
  name: string;
  description: string | null;
  color: string;
  documents: Array<{ id: string; filename: string; createdAt: string }>;
  reports: Array<{ id: string; title: string; createdAt: string }>;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchProject() {
      try {
        const response = await fetch(`/api/projects/${params.id}`);
        if (!response.ok) {
          router.push('/dashboard/projects');
          return;
        }
        const data = await response.json();
        setProject(data);
      } catch (error) {
        console.error('获取项目详情失败:', error);
      } finally {
        setIsLoading(false);
      }
    }

    if (params.id) {
      fetchProject();
    }
  }, [params.id, router]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">加载中...</div>;
  }

  if (!project) {
    return null;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/projects">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: project.color }}
          />
          <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
        </div>
      </div>

      {project.description && (
        <p className="text-muted-foreground">{project.description}</p>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              文档 ({project.documents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {project.documents.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                此项目还没有文档。
              </p>
            ) : (
              <div className="space-y-2">
                {project.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-accent"
                  >
                    <span className="text-sm font-medium">{doc.filename}</span>
                    <Badge variant="outline">
                      {new Date(doc.createdAt).toLocaleDateString('zh-CN')}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>报告 ({project.reports.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {project.reports.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-4">
                  此项目还没有报告。
                </p>
                <Button size="sm" asChild>
                  <Link href="/dashboard/reports/new">
                    <Plus className="h-4 w-4 mr-2" />
                    新建报告
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {project.reports.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-accent"
                  >
                    <span className="text-sm font-medium">{report.title}</span>
                    <Badge variant="outline">
                      {new Date(report.createdAt).toLocaleDateString('zh-CN')}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
