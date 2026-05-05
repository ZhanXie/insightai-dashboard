/**
 * 新建报告对话框
 */

'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const reportSchema = z.object({
  topic: z.string().min(1, '主题不能为空').max(200),
  templateId: z.string().min(1, '请选择模板'),
  projectId: z.string().optional(),
});

type ReportFormValues = z.infer<typeof reportSchema>;

interface CreateReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Template {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string | null;
}

interface Project {
  id: string;
  name: string;
}

export function CreateReportDialog({ open, onOpenChange }: CreateReportDialogProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      topic: '',
      templateId: '',
      projectId: '',
    },
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const [templatesRes, projectsRes] = await Promise.all([
          fetch('/api/templates'),
          fetch('/api/projects'),
        ]);
        const templatesData = await templatesRes.json();
        const projectsData = await projectsRes.json();
        setTemplates(templatesData.templates);
        setProjects(projectsData.projects);
      } catch (error) {
        console.error('获取数据失败:', error);
      }
    }

    if (open) {
      fetchData();
    }
  }, [open]);

  async function onSubmit(data: ReportFormValues) {
    setIsLoading(true);
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('创建报告失败');
      }

      const report = await response.json();
      router.push(`/dashboard/reports/${report.id}`);
      router.refresh();
      onOpenChange(false);
    } catch (error) {
      console.error('创建报告失败:', error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>新建报告</DialogTitle>
          <DialogDescription>
            选择一个模板和主题，开始生成你的研究报告。
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="topic"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>报告主题</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="例如：AI 芯片市场分析..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="templateId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>报告模板</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="选择模板" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name} ({template.category})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="projectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>关联项目（可选）</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="选择项目" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">无</SelectItem>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? '创建中...' : '创建报告'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
