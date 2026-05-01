import { withAuth } from "@/lib/http/handler";
import { createDocumentRecord, insertChunks, updateDocumentStatus } from "@/lib/documents/document-repository";
import { validateMime, validateSize, validateExtension } from "@/lib/documents/document-validator";
import { extractTextFromFile, chunkText } from "@/lib/document-processor";
import { embeddingModel } from "@/lib/ai";
import { embedMany } from "ai";
import { randomUUID } from "crypto";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export async function POST(request: Request) {
  return withAuth(async (req, { userId }) => {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      throw new Error("No file provided");
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new Error("File size exceeds 50MB limit");
    }

    // Validate file type
    let mimeType = file.type;
    let extension = file.name.split(".").pop()?.toLowerCase();
    
    // Try MIME type validation first
    let validationResult = validateMime(mimeType);
    
    if (!validationResult.valid && extension) {
      // Fall back to extension validation
      const extValidation = validateExtension(file.name);
      if (extValidation.valid && extValidation.mimeType) {
        mimeType = extValidation.mimeType;
        validationResult = validateMime(mimeType);
      }
    }
    
    if (!validationResult.valid) {
      throw new Error("Unsupported file format. Supported: PDF, TXT, MD, DOCX");
    }

    // Create document record first
    const document = await createDocumentRecord(
      userId,
      file.name,
      file.size,
      mimeType,
      "processing"
    );

    try {
      // Process file: extract text, chunk, embed, and store
      const fileBuffer = Buffer.from(await file.arrayBuffer());
      const text = await extractTextFromFile(fileBuffer, mimeType);

      if (!text.trim()) {
        await updateDocumentStatus(document.id, "error");
        throw new Error("No text content found in document");
      }

      // Chunk text
      const chunks = chunkText(text);

      if (chunks.length === 0) {
        await updateDocumentStatus(document.id, "error");
        throw new Error("Failed to chunk document");
      }

      // Generate embeddings for all chunks
      const { embeddings } = await embedMany({
        model: embeddingModel,
        values: chunks.map((c) => c.content),
      });

      // Insert chunks with embeddings using raw SQL (pgvector compatibility)
      const chunkData = chunks.map((chunk, i) => {
        const embedding = embeddings[i];
        // Convert embedding array to pgvector format string
        const embeddingStr = `[${embedding.join(",")}]`;
        
        return {
          documentId: document.id,
          content: chunk.content,
          position: chunk.position,
          embeddingStr
        };
      });
      
      await insertChunks(chunkData);

      // Update document status to ready
      await updateDocumentStatus(document.id, "ready", { chunkCount: chunks.length });

      return {
        id: document.id,
        filename: document.filename,
        status: "ready",
        chunkCount: chunks.length,
      };
    } catch (error) {
      // Mark document as error on failure
      await updateDocumentStatus(document.id, "error");
      throw error;
    }
  })(request);
}
