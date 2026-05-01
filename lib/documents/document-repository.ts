// Document repository service
// Encapsulates all Prisma queries related to documents and chunks

import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

// Create a document record
export async function createDocumentRecord(
  userId: string,
  filename: string,
  fileSize: number,
  mimeType: string,
  status: string = "pending"
) {
  return prisma.document.create({
    data: {
      userId,
      filename,
      fileSize,
      mimeType,
      status,
    },
  });
}

// Update document status
export async function updateDocumentStatus(
  id: string,
  status: string,
  extra?: { chunkCount?: number }
) {
  return prisma.document.update({
    where: { id },
    data: {
      status,
      ...(extra?.chunkCount !== undefined && { chunkCount: extra.chunkCount }),
    },
  });
}

// Batch insert chunks
export async function insertChunks(
  chunks: Array<{
    documentId: string;
    content: string;
    position: number;
    embeddingStr: string;
  }>
) {
  return prisma.$transaction(async (tx) => {
    for (const chunk of chunks) {
      const embeddingStr = chunk.embeddingStr;
      
      await tx.$executeRaw`
        INSERT INTO chunks (id, document_id, content, position, embedding)
        VALUES (${randomUUID()}, ${chunk.documentId}, ${chunk.content}, ${chunk.position}, ${embeddingStr}::vector)
      `;
    }
  });
}

// Count ready documents for a user
export async function countReadyDocuments(userId: string) {
  return prisma.document.count({
    where: { userId, status: "ready" },
  });
}

// Get document for user (with ownership check)
export async function getDocumentForUser(documentId: string, userId: string) {
  return prisma.document.findFirst({
    where: { id: documentId, userId },
    select: {
      id: true,
      filename: true,
      fileSize: true,
      mimeType: true,
      status: true,
      chunkCount: true,
      createdAt: true,
    },
  });
}