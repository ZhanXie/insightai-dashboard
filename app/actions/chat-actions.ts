"use server";

import { requireAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getChatSessions() {
  const guard = await requireAuth();
  if ("response" in guard) return [];
  const userId = guard.userId;

  return prisma.chatSession.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function getChatSessionMessages(sessionId: string) {
  const guard = await requireAuth();
  if ("response" in guard) return [];
  const userId = guard.userId;

  // Verify ownership
  const chatSession = await prisma.chatSession.findFirst({
    where: { id: sessionId, userId },
  });

  if (!chatSession) return [];

  return prisma.message.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      role: true,
      content: true,
      createdAt: true,
    },
  });
}

export async function createChatSession() {
  const guard = await requireAuth();
  if ("response" in guard) throw new Error("Unauthorized");
  const userId = guard.userId;

  const chatSession = await prisma.chatSession.create({
    data: {
      userId,
      title: "New Conversation",
    },
  });

  revalidatePath("/dashboard/chat");
  return chatSession;
}

export async function deleteChatSession(sessionId: string) {
  const guard = await requireAuth();
  if ("response" in guard) throw new Error("Unauthorized");
  const userId = guard.userId;

  const chatSession = await prisma.chatSession.findFirst({
    where: { id: sessionId, userId },
  });

  if (!chatSession) throw new Error("Chat session not found");

  await prisma.chatSession.delete({
    where: { id: sessionId },
  });

  revalidatePath("/dashboard/chat");
}
