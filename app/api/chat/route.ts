import { requireAuth } from "@/lib/auth-guard";
import { NextResponse } from "next/server";
import { chatModel, embeddingModel } from "@/lib/ai";
import { searchRelevantChunks } from "@/lib/vector-search";
import { embed } from "ai";
import { streamText } from "ai";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const guard = await requireAuth();
  if ("response" in guard) return guard.response;
  const userId = guard.userId;

  try {
    const { messages, sessionId } = await request.json();

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: "No messages provided" },
        { status: 400 }
      );
    }

    const lastUserMessage = messages[messages.length - 1].content;

    // Check if user has any ready documents
    const docCount = await prisma.document.count({
      where: { userId, status: "ready" },
    });

    let contextChunks: Awaited<ReturnType<typeof searchRelevantChunks>> = [];

    if (docCount > 0) {
      // Generate embedding for the query
      const { embedding } = await embed({
        model: embeddingModel,
        value: lastUserMessage,
      });

      // Retrieve relevant chunks
      contextChunks = await searchRelevantChunks(userId, embedding, 5);
    }

    // Build the system prompt with retrieved context
    let systemPrompt = `You are a helpful AI assistant for an intelligent dashboard. You help users answer questions based on their uploaded documents.`;

    if (contextChunks.length > 0) {
      const contextText = contextChunks
        .map(
          (chunk, i) =>
            `[Document: ${chunk.documentFilename}, Chunk ${chunk.position + 1}]\n${chunk.content}`
        )
        .join("\n\n---\n\n");

      systemPrompt += `\n\nBased on the following document excerpts, answer the user's question as accurately and completely as possible. If the answer cannot be found in these excerpts, say so clearly.\n\n${contextText}`;
    } else if (docCount > 0) {
      systemPrompt += `\n\nNo relevant document excerpts were found for this query. If you can answer from general knowledge, do so. Otherwise, inform the user that the documents don't contain relevant information.`;
    } else {
      systemPrompt += `\n\nThe user has not uploaded any documents yet. Please let them know they need to upload documents to the knowledge base before asking document-related questions.`;
    }

    // Create the messages array for the AI
    const aiMessages = [
      { role: "system" as const, content: systemPrompt },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    // Stream the response
    const result = streamText({
      model: chatModel,
      messages: aiMessages,
      onFinish: async (completion) => {
        // Save assistant response to database after streaming completes
        try {
          await prisma.message.create({
            data: {
              sessionId,
              role: "assistant",
              content: completion.text,
            },
          });
          // Update session's updatedAt
          await prisma.chatSession.update({
            where: { id: sessionId },
            data: { updatedAt: new Date() },
          });
        } catch (error) {
          console.error("Failed to save assistant response:", error);
        }
      },
    });

    // If we have a session ID, save the user message asynchronously after streaming starts
    if (sessionId) {
      saveUserMessage(sessionId, userId, messages).catch(console.error);
    }

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "An error occurred during chat",
      },
      { status: 500 }
    );
  }
}

/**
 * Save user message and create chat session if needed.
 * Runs asynchronously after streaming begins.
 */
async function saveUserMessage(
  sessionId: string,
  userId: string,
  messages: Array<{ role: string; content: string }>
) {
  try {
    // Check if session exists, create if not
    const existingSession = await prisma.chatSession.findUnique({
      where: { id: sessionId },
    });

    if (!existingSession) {
      const title =
        messages[0]?.content?.slice(0, 50) || "New Conversation";
      await prisma.chatSession.create({
        data: {
          id: sessionId,
          userId,
          title,
        },
      });
    }

    // Save user message
    const lastUserMessage = messages[messages.length - 1];
    await prisma.message.create({
      data: {
        sessionId,
        role: "user",
        content: lastUserMessage.content,
      },
    });
  } catch (error) {
    console.error("Failed to save user message:", error);
  }
}
