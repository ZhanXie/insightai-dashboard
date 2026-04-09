import { prisma } from "@/lib/prisma";

/**
 * Perform vector similarity search using pgvector.
 * Returns the top-K most relevant chunks for a given query,
 * scoped to the current user's documents only.
 */
export async function searchRelevantChunks(
  userId: string,
  queryEmbedding: number[],
  topK: number = 5
): Promise<
  Array<{
    id: string;
    content: string;
    position: number;
    documentFilename: string;
  }>
> {
  const embeddingStr = `[${queryEmbedding.join(",")}]`;

  const chunks = await prisma.$queryRaw`
    SELECT c.id, c.content, c.position, d.filename as "documentFilename"
    FROM chunks c
    INNER JOIN documents d ON c.document_id = d.id
    WHERE d.user_id = ${userId}::text
    ORDER BY c.embedding <-> ${embeddingStr}::vector
    LIMIT ${topK}
  ` as Array<{
    id: string;
    content: string;
    position: number;
    documentFilename: string;
  }>;

  return chunks;
}
