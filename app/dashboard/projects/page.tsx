/**
 * 项目列表页面
 */

'use client';

import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProjectCard } from '@/components/ProjectCard';
import { ProjectStats } from '@/components/ProjectStats';
import { CreateProjectDialog } from '@/components/CreateProjectDialog';

interface Project {
  id: string;
  name: string;
  description: string | null;
  color: string;
  createdAt: string;
  updatedAt: string;
  documents: Array<{ id: string; filename: string; createdAt: string }>;
  reports: Array<{ id: string; title: string; createdAt: string }>;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [stats, setStats] = useState({ projectCount: 0, documentCount: 0, reportCount: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  async function fetchProjects(page = 1) {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/projects?page=${page}&limit=10`);
      const data = await response.json();

      setProjects(data.projects);
      setPagination(data.pagination);
    } catch (error) {
      console.error('获取项目列表失败:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchStats() {
    try {
      const response = await fetch('/api/projects/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('获取项目统计失败:', error);
    }
  }

  useEffect(() => {
    fetchProjects();
    fetchStats();
  }, []);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">项目</h1>
          <p className="text-muted-foreground mt-1">
            管理你的知识库和文档组织
          </p>
        </div>

        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          新建项目
        </Button>
      </div>

      <ProjectStats {...stats} />

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">加载中...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <h2 className="text-xl font-semibold mb-2">还没有项目</h2>
          <p className="text-muted-foreground mb-4">
            创建一个项目来开始组织你的文档和报告。
          </p>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            创建第一个项目
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              id={project.id}
              name={project.name}
              description={project.description || undefined}
              color={project.color}
              documentCount={project.documents.length}
              reportCount={project.reports.length}
              updatedAt={new Date(project.updatedAt)}
            />
          ))}
        </div>
      )}

      <CreateProjectDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </div>
  );
}
