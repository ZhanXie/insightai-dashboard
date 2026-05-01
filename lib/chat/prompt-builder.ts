// Prompt builder service
// Constructs system prompts and AI message arrays for chat API

import { searchRelevantChunks } from "@/lib/vector-search";
import { prisma } from "@/lib/prisma";
import { embeddingModel } from "@/lib/ai";
import { embed } from "ai";

// Build system prompt with RAG context
export async function buildSystemPrompt(
  userId: string,
  query: string
): Promise<string> {
  // Check if user has any ready documents
  const docCount = await prisma.document.count({
    where: { userId, status: "ready" },
  });

  let systemPrompt = `You are a helpful AI assistant for an intelligent dashboard. You help users answer questions based on their uploaded documents.`;

  if (docCount > 0) {
    // Generate embedding for the query
    const { embedding } = await embed({
      model: embeddingModel,
      value: query,
    });

    // Retrieve relevant chunks
    const contextChunks = await searchRelevantChunks(userId, embedding, 5);

    if (contextChunks.length > 0) {
      const contextText = contextChunks
        .map(
          (chunk) =>
            `[Document: ${chunk.documentFilename}, Chunk ${chunk.position + 1}]\n${chunk.content}`
        )
        .join("\n\n---\n\n");

      systemPrompt += `\n\nBased on the following document excerpts, answer the user's question as accurately and completely as possible. If the answer cannot be found in these excerpts, say so clearly.\n\n${contextText}`;
    } else {
      systemPrompt += `\n\nNo relevant document excerpts were found for this query. If you can answer from general knowledge, do so. Otherwise, inform the user that the documents don't contain relevant information.`;
    }
  } else {
    systemPrompt += `\n\nThe user has not uploaded any documents yet. Please let them know they need to upload documents to the knowledge base before asking document-related questions.`;
  }

  return systemPrompt;
}

// Build messages array for AI API
export function buildAiMessages(
  systemPrompt: string,
  userMessages: Array<{ role: string; content: string }>
) {
  return [
    { role: "system" as const, content: systemPrompt },
    ...userMessages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  ];
}