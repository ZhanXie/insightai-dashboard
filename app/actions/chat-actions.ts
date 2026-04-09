"use server";

import { auth } from "@/app/api/auth/[...nextauth]/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getChatSessions() {
  const session = await auth();
  if (!session?.user?.id) return [];

  return prisma.chatSession.findMany({
    where: { userId: session.user.id },
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
  const session = await auth();
  if (!session?.user?.id) return [];

  // Verify ownership
  const chatSession = await prisma.chatSession.findFirst({
    where: { id: sessionId, userId: session.user.id },
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
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const chatSession = await prisma.chatSession.create({
    data: {
      userId: session.user.id,
      title: "New Conversation",
    },
  });

  revalidatePath("/dashboard/chat");
  return chatSession;
}

export async function deleteChatSession(sessionId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const chatSession = await prisma.chatSession.findFirst({
    where: { id: sessionId, userId: session.user.id },
  });

  if (!chatSession) throw new Error("Chat session not found");

  await prisma.chatSession.delete({
    where: { id: sessionId },
  });

  revalidatePath("/dashboard/chat");
}
