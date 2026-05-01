// Chat session service
// Handles CRUD operations for chat sessions with ownership verification

import { prisma } from "@/lib/prisma";

// Create a new chat session
export async function createSession(userId: string, title?: string) {
  return prisma.chatSession.create({
    data: {
      userId,
      title: title || "New Conversation",
    },
  });
}

// Get a specific session by ID (with ownership check)
export async function getSession(sessionId: string, userId: string) {
  return prisma.chatSession.findFirst({
    where: { id: sessionId, userId },
  });
}

// List user's sessions
export async function listSessions(
  userId: string,
  limit: number = 50,
  offset: number = 0
) {
  return prisma.chatSession.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: limit,
    skip: offset,
    select: {
      id: true,
      title: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

// Delete a session (with ownership check)
export async function deleteSession(sessionId: string, userId: string) {
  const session = await prisma.chatSession.findFirst({
    where: { id: sessionId, userId },
  });

  if (!session) {
    throw new Error("Session not found");
  }

  await prisma.chatSession.delete({
    where: { id: sessionId },
  });

  return sessionId;
}

// Update session title (with ownership check)
export async function updateSessionTitle(
  sessionId: string,
  userId: string,
  title: string
) {
  const session = await prisma.chatSession.findFirst({
    where: { id: sessionId, userId },
  });

  if (!session) {
    throw new Error("Session not found");
  }

  await prisma.chatSession.update({
    where: { id: sessionId },
    data: { title },
  });
}