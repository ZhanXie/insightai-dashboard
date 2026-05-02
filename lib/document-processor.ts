import mammoth from "mammoth";

// Dynamic import for pdf-parse (CJS module)
async function getPdfParse() {
  // @ts-expect-error pdf-parse has no types
  const { default: pdfParse } = await import("pdf-parse");
  return pdfParse;
}

export async function extractTextFromFile(
  fileBuffer: Buffer,
  mimeType: string
): Promise<string> {
  switch (mimeType) {
    case "application/pdf":
      return extractFromPdf(fileBuffer);
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      return extractFromDocx(fileBuffer);
    case "text/plain":
    case "text/markdown":
    case "text/x-markdown":
      return fileBuffer.toString("utf-8");
    default:
      // Try as plain text for unknown text-based types
      return fileBuffer.toString("utf-8");
  }
}

async function extractFromPdf(buffer: Buffer): Promise<string> {
  try {
    const pdfParse = await getPdfParse();
    const data = await pdfParse(buffer);
    return data.text;
  } catch {
    throw new Error("Failed to extract text from PDF");
  }
}

async function extractFromDocx(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch {
    throw new Error("Failed to extract text from DOCX");
  }
}

/**
 * Configuration for chunking
 */
export interface ChunkingConfig {
  /** Maximum chunk size in characters (~4 chars per token) */
  maxChunkSize: number;
  /** Overlap between chunks in characters */
  overlap: number;
  /** Enable Markdown header-aware chunking */
  respectMarkdown: boolean;
  /** Minimum chunk size - very small chunks will be merged */
  minChunkSize: number;
}

export const DEFAULT_CHUNKING_CONFIG: ChunkingConfig = {
  maxChunkSize: 1500,  // ~1500 chars ≈ 400 tokens, increased for better context
  overlap: 300,         // ~300 chars overlap for continuity
  respectMarkdown: true,
  minChunkSize: 200,   // Minimum ~50 tokens per chunk
};

/**
 * Check if a line is a Markdown header
 */
function isMarkdownHeader(line: string): { level: number; text: string } | null {
  const match = line.match(/^(#{1,6})\s+(.+)$/);
  if (match) {
    return {
      level: match[1].length,
      text: match[2].trim(),
    };
  }
  return null;
}

/**
 * Split text into semantically meaningful chunks.
 * Improved version with:
 * - Markdown header awareness (preserves document structure)
 * - Larger chunks for better context
 * - Better Chinese text handling
 */
export function chunkText(
  text: string,
  maxChunkSize: number = DEFAULT_CHUNKING_CONFIG.maxChunkSize,
  overlap: number = DEFAULT_CHUNKING_CONFIG.overlap,
  respectMarkdown: boolean = DEFAULT_CHUNKING_CONFIG.respectMarkdown
): { content: string; position: number; heading?: string }[] {
  const chunks: { content: string; position: number; heading?: string }[] = [];

  if (!text.trim()) {
    return chunks;
  }

  // If Markdown-aware chunking is enabled, process accordingly
  if (respectMarkdown) {
    return chunkTextWithMarkdown(text, maxChunkSize, overlap);
  }

  // Fallback to paragraph-based chunking
  return chunkTextByParagraphs(text, maxChunkSize, overlap);
}

/**
 * Markdown-aware chunking that respects document structure
 */
function chunkTextWithMarkdown(
  text: string,
  maxChunkSize: number,
  overlap: number
): { content: string; position: number; heading?: string }[] {
  const chunks: { content: string; position: number; heading?: string }[] = [];
  const lines = text.split("\n");

  let currentChunk = "";
  let currentHeading = "";
  let position = 0;

  // Track the current section heading for context
  const headingStack: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if this is a Markdown header
    const headerMatch = isMarkdownHeader(line);
    if (headerMatch) {
      // Update heading stack (keep only parent headings)
      while (headingStack.length >= headerMatch.level) {
        headingStack.pop();
      }
      headingStack.push(headerMatch.text);
      currentHeading = headingStack.join(" > ");
    }

    const trimmedLine = line.trim();

    // Skip empty lines but preserve paragraph breaks
    if (!trimmedLine) {
      if (currentChunk.trim()) {
        currentChunk += "\n\n";
      }
      continue;
    }

    // Check if adding this line would exceed max chunk size
    const projectedChunk = currentChunk
      ? currentChunk + "\n\n" + trimmedLine
      : trimmedLine;

    if (projectedChunk.length > maxChunkSize) {
      // Push current chunk if it has content
      if (currentChunk.trim()) {
        chunks.push({
          content: currentChunk.trim(),
          position: position++,
          heading: currentHeading || undefined,
        });
      }

      // Create overlap from the end of current chunk
      if (currentChunk.length > overlap && overlap > 0) {
        const overlapText = currentChunk.slice(-overlap);
        currentChunk = overlapText + "\n\n" + trimmedLine;
      } else {
        currentChunk = trimmedLine;
      }
    } else {
      currentChunk = projectedChunk;
    }

    // Also handle extremely long single lines (force split)
    if (trimmedLine.length > maxChunkSize * 1.5) {
      // Force split long lines
      if (currentChunk.trim() && currentChunk !== trimmedLine) {
        chunks.push({
          content: currentChunk.trim(),
          position: position++,
          heading: currentHeading || undefined,
        });
        currentChunk = "";
      }

      // Split by sentences for Chinese and English
      const sentences = splitBySentences(trimmedLine);
      let tempChunk = "";

      for (const sentence of sentences) {
        if ((tempChunk + " " + sentence).length > maxChunkSize) {
          if (tempChunk.trim()) {
            chunks.push({
              content: tempChunk.trim(),
              position: position++,
              heading: currentHeading || undefined,
            });
          }
          tempChunk = sentence;
        } else {
          tempChunk = tempChunk ? tempChunk + " " + sentence : sentence;
        }
      }

      currentChunk = tempChunk;
    }
  }

  // Don't forget the last chunk
  if (currentChunk.trim()) {
    chunks.push({
      content: currentChunk.trim(),
      position: position,
      heading: currentHeading || undefined,
    });
  }

  // Post-process: merge very small chunks with previous ones
  return mergeSmallChunks(chunks, DEFAULT_CHUNKING_CONFIG.minChunkSize);
}

/**
 * Split text by sentences, better support for Chinese
 */
function splitBySentences(text: string): string[] {
  // Chinese sentence delimiters: 。！？； followed by space or end
  // English: . ! ? followed by space or end
  const chinesePattern = /[。！？；](?=\s|$)/;
  const englishPattern = /[.!?](?=\s|$)/;

  // Try Chinese first
  if (chinesePattern.test(text)) {
    return text.split(chinesePattern).map((s) => s.trim()).filter(Boolean);
  }

  // Fall back to English
  if (englishPattern.test(text)) {
    return text.split(englishPattern).map((s) => s.trim()).filter(Boolean);
  }

  // No clear sentence boundaries, return as single segment
  return [text];
}

/**
 * Paragraph-based chunking (fallback)
 */
function chunkTextByParagraphs(
  text: string,
  maxChunkSize: number,
  overlap: number
): { content: string; position: number }[] {
  const chunks: { content: string; position: number }[] = [];

  if (!text.trim()) {
    return chunks;
  }

  // Split by paragraphs (double newlines or single with significant content)
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim());

  let currentChunk = "";
  let position = 0;

  for (const paragraph of paragraphs) {
    const trimmedParagraph = paragraph.trim();

    // If a single paragraph exceeds chunk size, split it by sentences
    if (trimmedParagraph.length > maxChunkSize) {
      // First, push any accumulated chunk
      if (currentChunk.trim()) {
        chunks.push({
          content: currentChunk.trim(),
          position: position++,
        });
        currentChunk = "";
      }

      // Split large paragraph by sentences
      const sentences = splitBySentences(trimmedParagraph);
      for (const sentence of sentences) {
        if (sentence.length > maxChunkSize) {
          // Force split long sentences
          for (let i = 0; i < sentence.length; i += maxChunkSize - overlap) {
            chunks.push({
              content: sentence.slice(i, i + maxChunkSize).trim(),
              position: position++,
            });
          }
        } else if ((currentChunk + " " + sentence).trim().length > maxChunkSize) {
          chunks.push({
            content: currentChunk.trim(),
            position: position++,
          });
          currentChunk = sentence;
        } else {
          currentChunk = currentChunk
            ? currentChunk + " " + sentence
            : sentence;
        }
      }
    } else if (
      currentChunk &&
      (currentChunk + "\n\n" + trimmedParagraph).length > maxChunkSize
    ) {
      // Push current chunk and start new one with overlap
      chunks.push({
        content: currentChunk.trim(),
        position: position++,
      });

      // Create overlap by taking the end of the current chunk
      const overlapText =
        currentChunk.length > overlap
          ? currentChunk.slice(-overlap)
          : currentChunk;
      currentChunk = overlapText + "\n\n" + trimmedParagraph;
    } else {
      currentChunk = currentChunk
        ? currentChunk + "\n\n" + trimmedParagraph
        : trimmedParagraph;
    }
  }

  // Don't forget the last chunk
  if (currentChunk.trim()) {
    chunks.push({
      content: currentChunk.trim(),
      position: position,
    });
  }

  return chunks;
}

/**
 * Merge small chunks with previous ones to avoid tiny fragments
 */
function mergeSmallChunks(
  chunks: { content: string; position: number; heading?: string }[],
  minSize: number
): { content: string; position: number; heading?: string }[] {
  if (chunks.length <= 1) return chunks;

  const result: { content: string; position: number; heading?: string }[] = [];
  let current = { ...chunks[0] };

  for (let i = 1; i < chunks.length; i++) {
    const chunk = chunks[i];

    // If current chunk is too small, merge with next
    if (current.content.length < minSize && i < chunks.length) {
      current.content += "\n\n" + chunk.content;
      // Keep the heading of the larger chunk
      if (chunk.content.length > current.content.length / 2) {
        current.heading = chunk.heading;
      }
    } else {
      result.push(current);
      current = { ...chunk };
    }
  }

  // Don't forget the last chunk
  if (current.content) {
    result.push(current);
  }

  // Re-number positions
  return result.map((c, idx) => ({ ...c, position: idx }));
}
