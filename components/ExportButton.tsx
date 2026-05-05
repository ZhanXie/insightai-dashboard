/**
 * 导出按钮组件
 */

'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ExportButtonProps {
  reportId: string;
  title: string;
}

export function ExportButton({ reportId, title }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  async function handleExport(format: 'markdown' | 'word' | 'pdf') {
    setIsExporting(true);
    try {
      const response = await fetch(`/api/reports/${reportId}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format }),
      });

      if (!response.ok) {
        throw new Error('导出失败');
      }

      // 获取文件名
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1].replace(/"/g, '')
        : `${title}.${format === 'markdown' ? 'md' : format === 'word' ? 'docx' : 'pdf'}`;

      // 下载文件
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('导出失败:', error);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <DropdownMenu>
      {/* @ts-expect-error asChild type mismatch with base-ui */}
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isExporting} className="cursor-pointer">
          <Download className="h-4 w-4 mr-2" />
          导出
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => handleExport('markdown')}>
          Markdown
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('word')}>
          Word (.docx)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('pdf')} disabled>
          PDF (即将支持)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
