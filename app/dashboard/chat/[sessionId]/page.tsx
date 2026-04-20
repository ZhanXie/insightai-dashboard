import { requireAuth } from "@/lib/auth-guard";
import { notFound } from "next/navigation";
import { getChatSessions, getChatSessionMessages } from "@/app/actions/chat-actions";
import ChatClient from "../ChatClient";

export default async function ChatSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const guard = await requireAuth();
  if ("response" in guard) return null;

  const { sessionId } = await params;

  const [sessions, messages] = await Promise.all([
    getChatSessions(),
    getChatSessionMessages(sessionId),
  ]);

  // Verify the session belongs to the user
  const currentSession = sessions.find((s) => s.id === sessionId);
  if (!currentSession) {
    notFound();
  }

  return (
    <ChatClient
      sessions={sessions}
      messages={messages}
      currentSessionId={sessionId}
    />
  );
}