/**
 * Export 服务层
 * 负责报告导出功能
 */

import { exportToMarkdown, reportToMarkdown } from './markdown-export';
import { exportToWord, reportToWord } from './word-export';

export type ExportFormat = 'markdown' | 'word' | 'pdf';

export interface ExportResult {
  data: string | Buffer;
  filename: string;
  contentType: string;
}

/**
 * Export 服务类
 */
export class ExportService {
  /**
   * 导出报告
   */
  async exportReport(
    report: {
      title: string;
      summary?: string;
      sections?: Array<{ title: string; content: string }>;
    },
    format: ExportFormat,
    options: { filename?: string } = {}
  ): Promise<ExportResult> {
    switch (format) {
      case 'markdown': {
        const { data, filename } = reportToMarkdown(report, options);
        return {
          data,
          filename,
          contentType: 'text/markdown',
        };
      }

      case 'word': {
        const { data, filename } = await reportToWord(report, options);
        return {
          data,
          filename,
          contentType:
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        };
      }

      case 'pdf': {
        // TODO: 实现 PDF 导出 (使用 @react-pdf/renderer 或 puppeteer)
        // 暂时 fallback 到 Word
        const { data, filename } = await reportToWord(report, {
          ...options,
          filename: options.filename?.replace(/\.pdf$/, '.docx'),
        });
        return {
          data,
          filename,
          contentType: 'application/pdf',
        };
      }

      default:
        throw new Error(`不支持的导出格式: ${format}`);
    }
  }

  /**
   * 获取文件名
   */
  generateFilename(title: string, format: ExportFormat): string {
    const base = title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '-').substring(0, 50);
    const date = new Date().toISOString().split('T')[0];
    const extensions: Record<ExportFormat, string> = {
      markdown: '.md',
      word: '.docx',
      pdf: '.pdf',
    };

    return `${base}-${date}${extensions[format]}`;
  }
}

// 导出单例
export const exportService = new ExportService();
