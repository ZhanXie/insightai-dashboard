/**
 * 文档分配对话框
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AssignDocumentDialogProps {
  documentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentProjectId?: string | null;
  onSuccess?: () => void;
}

interface Project {
  id: string;
  name: string;
}

export function AssignDocumentDialog({
  documentId,
  open,
  onOpenChange,
  currentProjectId,
  onSuccess,
}: AssignDocumentDialogProps) {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchProjects() {
      try {
        const res = await fetch('/api/projects?limit=50');
        const data = await res.json();
        setProjects(data.projects || []);
        setSelectedProjectId(currentProjectId || '');
      } catch (error) {
        console.error('获取项目列表失败:', error);
      }
    }

    if (open) {
      fetchProjects();
    }
  }, [open, currentProjectId]);

  async function handleAssign() {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/documents/${documentId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: selectedProjectId || null }),
      });

      if (!response.ok) throw new Error('分配失败');

      onOpenChange(false);
      onSuccess?.();
      router.refresh();
    } catch (error) {
      console.error('分配文档失败:', error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>分配文档到项目</DialogTitle>
          <DialogDescription>
            选择要将此文档归属到的知识库项目。
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Select value={selectedProjectId} onValueChange={setSelectedProjectId as any}>
            <SelectTrigger>
              <SelectValue placeholder="选择项目（或无）" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">无（独立文档）</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleAssign} disabled={isLoading}>
            {isLoading ? '保存中...' : '确认分配'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
