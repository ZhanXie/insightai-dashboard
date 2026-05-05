/**
 * Markdown 导出
 */

export interface ExportOptions {
  filename?: string;
}

/**
 * 将内容导出为 Markdown 格式
 */
export function exportToMarkdown(
  content: string,
  options: ExportOptions = {}
): { data: string; filename: string } {
  const filename = options.filename || `report-${Date.now()}.md`;

  return {
    data: content,
    filename,
  };
}

/**
 * 将报告对象导出为 Markdown
 */
export function reportToMarkdown(
  report: {
    title: string;
    summary?: string;
    sections?: Array<{ title: string; content: string }>;
  },
  options: ExportOptions = {}
): { data: string; filename: string } {
  let markdown = `# ${report.title}\n\n`;

  if (report.summary) {
    markdown += `> ${report.summary}\n\n`;
  }

  if (report.sections) {
    report.sections.forEach(section => {
      markdown += `## ${section.title}\n\n`;
      markdown += `${section.content}\n\n`;
    });
  }

  const filename = options.filename || `${report.title.replace(/\s+/g, '-')}.md`;

  return {
    data: markdown,
    filename,
  };
}
