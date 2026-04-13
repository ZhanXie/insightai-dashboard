import { requireAuth } from "@/lib/auth-guard";
import { notFound } from "next/navigation";
import { getChatSessions, getChatSessionMessages } from "@/app/actions/chat-actions";
import ChatPage from "../page";

export default async function ChatSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const guard = await requireAuth();
  if ("response" in guard) return null;

  const { sessionId } = await params;

  const sessions = await getChatSessions();
  const messages = await getChatSessionMessages(sessionId);

  // Verify the session belongs to the user
  const currentSession = sessions.find((s) => s.id === sessionId);
  if (!currentSession && messages.length === 0) {
    notFound();
  }

  return (
    <ChatPage
      sessions={sessions}
      messages={messages}
      currentSessionId={sessionId}
    />
  );
}
