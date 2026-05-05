/**
 * Word 导出
 * 使用 docx 库生成 Word 文档
 */

import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { ExportOptions } from './markdown-export';

/**
 * 将内容导出为 Word 格式
 */
export async function exportToWord(
  content: string,
  options: ExportOptions = {}
): Promise<{ data: Buffer; filename: string }> {
  const filename = options.filename || `report-${Date.now()}.docx`;

  // 简单实现：将文本按段落分割
  const paragraphs = content.split('\n\n').map(block => {
    // 判断是否是标题
    if (block.startsWith('# ')) {
      return new Paragraph({
        children: [new TextRun({ text: block.replace('# ', ''), bold: true, size: 48 })],
        heading: HeadingLevel.HEADING_1,
      });
    }
    if (block.startsWith('## ')) {
      return new Paragraph({
        children: [new TextRun({ text: block.replace('## ', ''), bold: true, size: 36 })],
        heading: HeadingLevel.HEADING_2,
      });
    }
    if (block.startsWith('### ')) {
      return new Paragraph({
        children: [new TextRun({ text: block.replace('### ', ''), bold: true, size: 28 })],
        heading: HeadingLevel.HEADING_3,
      });
    }

    return new Paragraph({
      children: [new TextRun(block)],
      spacing: { after: 200 },
    });
  });

  const doc = new Document({
    sections: [
      {
        children: paragraphs,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);

  return {
    data: buffer,
    filename,
  };
}

/**
 * 将报告对象导出为 Word
 */
export async function reportToWord(
  report: {
    title: string;
    summary?: string;
    sections?: Array<{ title: string; content: string }>;
  },
  options: ExportOptions = {}
): Promise<{ data: Buffer; filename: string }> {
  const filename = options.filename || `${report.title.replace(/\s+/g, '-')}.docx`;

  const children: any[] = [
    new Paragraph({
      children: [new TextRun({ text: report.title, bold: true, size: 48 })],
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 200 },
    }),
  ];

  if (report.summary) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: report.summary, italics: true })],
        spacing: { after: 400 },
      })
    );
  }

  if (report.sections) {
    report.sections.forEach(section => {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: section.title, bold: true, size: 36 })],
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 },
        }),
        new Paragraph({
          children: [new TextRun(section.content)],
          spacing: { after: 200 },
        })
      );
    });
  }

  const doc = new Document({
    sections: [
      {
        children,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);

  return {
    data: buffer,
    filename,
  };
}
