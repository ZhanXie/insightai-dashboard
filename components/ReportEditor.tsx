/**
 * 报告编辑器组件
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const reportEditSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(100),
  topic: z.string().min(1, '主题不能为空').max(200),
});

type ReportEditValues = z.infer<typeof reportEditSchema>;

interface ReportEditorProps {
  reportId: string;
  initialTitle: string;
  initialTopic: string;
  onSaveSuccess?: () => void;
}

export function ReportEditor({ reportId, initialTitle, initialTopic, onSaveSuccess }: ReportEditorProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<ReportEditValues>({
    resolver: zodResolver(reportEditSchema),
    defaultValues: {
      title: initialTitle,
      topic: initialTopic,
    },
  });

  async function onSubmit(data: ReportEditValues) {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('保存失败');

      onSaveSuccess?.();
      router.refresh();
    } catch (error) {
      console.error('保存报告失败:', error);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">编辑报告信息</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>标题</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="topic"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>研究主题</FormLabel>
                  <FormControl>
                    <Textarea {...field} className="resize-none" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? '保存中...' : '保存修改'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
