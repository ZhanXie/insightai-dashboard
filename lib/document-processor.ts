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
 * Split text into overlapping chunks of 500-1000 tokens.
 * Uses ~4 chars per token estimate, with 100 token (~400 chars) overlap.
 */
export function chunkText(
  text: string,
  maxChunkSize: number = 800, // ~800 chars ≈ 200 tokens, conservative estimate
  overlap: number = 400 // ~400 chars ≈ 100 tokens overlap
): { content: string; position: number }[] {
  const chunks: { content: string; position: number }[] = [];

  if (!text.trim()) {
    return chunks;
  }

  // Try to split by paragraphs first for better semantic boundaries
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
      const sentences = trimmedParagraph.split(/(?<=[.!?])\s+/);
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
