import { requireAuth } from "@/lib/auth-guard";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractTextFromFile, chunkText } from "@/lib/document-processor";
import { embeddingModel } from "@/lib/ai";
import { embedMany } from "ai";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_MIME_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "text/plain": "txt",
  "text/markdown": "md",
  "text/x-markdown": "md",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};

export async function POST(request: Request) {
  const guard = await requireAuth();
  if ("response" in guard) return guard.response;
  const userId = guard.userId;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 50MB limit" },
        { status: 400 }
      );
    }

    // Validate file type
    const extension = file.name.split(".").pop()?.toLowerCase();
    const isValidType =
      ALLOWED_MIME_TYPES[file.type] ||
      (extension && ["pdf", "txt", "md", "docx"].includes(extension));

    if (!isValidType) {
      return NextResponse.json(
        { error: "Unsupported file format. Supported: PDF, TXT, MD, DOCX" },
        { status: 400 }
      );
    }

    const mimeType = ALLOWED_MIME_TYPES[file.type]
      ? file.type
      : `application/${extension}`;

    // Create document record first
    const document = await prisma.document.create({
      data: {
        userId,
        filename: file.name,
        fileSize: file.size,
        mimeType,
        status: "processing",
      },
    });

    // Process file: extract text, chunk, embed, and store
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const text = await extractTextFromFile(fileBuffer, mimeType);

    if (!text.trim()) {
      await prisma.document.update({
        where: { id: document.id },
        data: { status: "error" },
      });
      return NextResponse.json(
        { error: "No text content found in document" },
        { status: 400 }
      );
    }

    // Chunk text
    const chunks = chunkText(text);

    if (chunks.length === 0) {
      await prisma.document.update({
        where: { id: document.id },
        data: { status: "error" },
      });
      return NextResponse.json(
        { error: "Failed to chunk document" },
        { status: 500 }
      );
    }

    // Generate embeddings for all chunks
    const { embeddings } = await embedMany({
      model: embeddingModel,
      values: chunks.map((c) => c.content),
    });

    // Insert chunks with embeddings using raw SQL (pgvector compatibility)
    // Wrap all inserts in a transaction to ensure atomicity
    await prisma.$transaction(async (tx) => {
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const embedding = embeddings[i];

        // Convert embedding array to pgvector format string
        const embeddingStr = `[${embedding.join(",")}]`;

        await tx.$executeRaw`
          INSERT INTO chunks (id, document_id, content, position, embedding)
          VALUES (${crypto.randomUUID()}, ${document.id}, ${chunk.content}, ${chunk.position}, ${embeddingStr}::vector)
        `;
      }
    });

    // Update document status to ready
    await prisma.document.update({
      where: { id: document.id },
      data: {
        status: "ready",
        chunkCount: chunks.length,
      },
    });

    return NextResponse.json({
      id: document.id,
      filename: document.filename,
      status: "ready",
      chunkCount: chunks.length,
    });
  } catch (error) {
    console.error("Upload error:", error);

    // If we have a document ID, mark it as error
    // (best effort - might not have document if validation failed)

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "An error occurred during upload",
      },
      { status: 500 }
    );
  }
}
