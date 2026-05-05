/**
 * 报告章节组件
 */

import { cn } from '@/lib/utils';

interface ReportSectionProps {
  title: string;
  content: string;
  className?: string;
}

export function ReportSection({ title, content, className }: ReportSectionProps) {
  return (
    <div className={cn('space-y-3', className)}>
      <h3 className="text-lg font-semibold">{title}</h3>
      <div
        className="prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: formatMarkdown(content) }}
      />
    </div>
  );
}

/**
 * 简单的 Markdown 格式化（生产环境建议使用 react-markdown）
 */
function formatMarkdown(md: string): string {
  return md
    .replace(/### (.*)/g, '<h4>$1</h4>')
    .replace(/## (.*)/g, '<h3>$1</h3>')
    .replace(/# (.*)/g, '<h2>$1</h2>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br/>');
}
