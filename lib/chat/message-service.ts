// Message service
// Handles persistence and retrieval of chat messages

import { prisma } from "@/lib/prisma";

// Save a message to a session
export async function saveMessage(
  sessionId: string,
  role: "user" | "assistant",
  content: string
) {
  return prisma.message.create({
    data: {
      sessionId,
      role,
      content,
    },
  });
}

// Get all messages for a session
export async function getMessages(sessionId: string) {
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