"use server";

import { requireAuth } from "@/lib/auth-guard";
import { revalidatePath } from "next/cache";
import {
  createSession,
  getSession,
  listSessions,
  deleteSession,
  updateSessionTitle,
} from "@/lib/chat/session-service";
import { getMessages } from "@/lib/chat/message-service";

export async function getChatSessions() {
  const guard = await requireAuth();
  if ("response" in guard) return [];
  const { userId } = guard;

  return listSessions(userId);
}

export async function getChatSessionMessages(sessionId: string) {
  const guard = await requireAuth();
  if ("response" in guard) return [];
  const { userId } = guard;

  // Verify ownership
  const session = await getSession(sessionId, userId);
  if (!session) return [];

  return getMessages(sessionId);
}

export async function createChatSession() {
  const guard = await requireAuth();
  if ("response" in guard) throw new Error("Unauthorized");
  const { userId } = guard;

  const chatSession = await createSession(userId);
  revalidatePath("/dashboard/chat");
  return chatSession;
}

export async function deleteChatSession(sessionId: string) {
  const guard = await requireAuth();
  if ("response" in guard) throw new Error("Unauthorized");
  const { userId } = guard;

  await deleteSession(sessionId, userId);
  revalidatePath("/dashboard/chat");
}

export async function updateChatSessionTitle(sessionId: string, title: string) {
  const guard = await requireAuth();
  if ("response" in guard) throw new Error("Unauthorized");
  const { userId } = guard;

  await updateSessionTitle(sessionId, userId, title);
  revalidatePath("/dashboard/chat");
}
