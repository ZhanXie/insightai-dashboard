import { withAuth } from "@/lib/http/handler";
import { createSession, getSession } from "@/lib/chat/session-service";
import { saveMessage } from "@/lib/chat/message-service";
import { buildSystemPrompt, buildAiMessages } from "@/lib/chat/prompt-builder";
import { truncateMessages } from "@/lib/chat/message-window";
import { chatModel } from "@/lib/ai";
import { streamText } from "ai";

export const POST = withAuth(async (req, context) => {
  const { userId } = context;
  const { messages, sessionId: requestSessionId } = await req.json();

  if (!messages || messages.length === 0) {
    return Response.json({ error: "No messages provided" }, { status: 400 });
  }

  const lastUserMessage = messages[messages.length - 1].content;

  // Create or verify session
  let sessionId = requestSessionId;
  let isNewSession = false;

  if (!sessionId) {
    const newSession = await createSession(userId, lastUserMessage.slice(0, 50));
    sessionId = newSession.id;
    isNewSession = true;
  } else {
    const existing = await getSession(sessionId, userId);
    if (!existing) {
      const newSession = await createSession(userId, lastUserMessage.slice(0, 50));
      sessionId = newSession.id;
      isNewSession = true;
    }
  }

  // Save user message
  await saveMessage(sessionId, "user", lastUserMessage);

  // Build system prompt with RAG context
  const systemPrompt = await buildSystemPrompt(userId, lastUserMessage);

  // Build AI messages and apply token window truncation
  const fullMessages = buildAiMessages(systemPrompt, messages);
  const systemMsg = fullMessages[0];
  const historyMessages = fullMessages.slice(1);
  const truncatedMessages = truncateMessages(systemPrompt, historyMessages);

  // Build the final messages array with proper types
  const aiMessages = [
    systemMsg,
    ...truncatedMessages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  ];

  // Stream the response
  const result = streamText({
    model: chatModel,
    messages: aiMessages,
    onFinish: async (completion) => {
      try {
        await saveMessage(sessionId, "assistant", completion.text);
      } catch (error) {
        console.error("Failed to save assistant response:", error);
      }
    },
  });

  const response = result.toDataStreamResponse();

  if (isNewSession) {
    response.headers.set("X-Session-Id", sessionId);
  }

  return response;
});
