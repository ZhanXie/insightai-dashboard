import { requireAuth } from "@/lib/auth-guard";
import { getChatSessions } from "@/app/actions/chat-actions";
import ChatClient from "./ChatClient";

export default async function ChatPage() {
  const guard = await requireAuth();
  if ("response" in guard) return null;

  const sessions = await getChatSessions();

  return (
    <ChatClient
      sessions={sessions}
      messages={[]}
      currentSessionId={null}
    />
  );
}