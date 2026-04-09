"use server";

import { auth } from "@/app/api/auth/[...nextauth]/auth";
import { prisma } from "@/lib/prisma";

export async function getDashboardStats() {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      totalDocuments: 0,
      totalChunks: 0,
      totalSessions: 0,
      totalMessages: 0,
    };
  }

  const userId = session.user.id;

  const [totalDocuments, totalChunks, totalSessions, totalMessages] =
    await Promise.all([
      prisma.document.count({ where: { userId } }),
      prisma.chunk.count({
        where: { document: { userId } },
      }),
      prisma.chatSession.count({ where: { userId } }),
      prisma.message.count({
        where: { session: { userId } },
      }),
    ]);

  return { totalDocuments, totalChunks, totalSessions, totalMessages };
}

export async function getDocumentsOverTime() {
  const session = await auth();
  if (!session?.user?.id) return [];

  const documents = await prisma.document.findMany({
    where: { userId: session.user.id },
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  // Group by date
  const dateMap = new Map<string, number>();
  documents.forEach((doc) => {
    const date = doc.createdAt.toISOString().split("T")[0];
    dateMap.set(date, (dateMap.get(date) || 0) + 1);
  });

  return Array.from(dateMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function getChatActivity() {
  const session = await auth();
  if (!session?.user?.id) return [];

  const messages = await prisma.message.findMany({
    where: {
      session: { userId: session.user.id },
      createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    },
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  // Group by date
  const dateMap = new Map<string, number>();
  messages.forEach((msg) => {
    const date = msg.createdAt.toISOString().split("T")[0];
    dateMap.set(date, (dateMap.get(date) || 0) + 1);
  });

  return Array.from(dateMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function getDocumentFormatDistribution() {
  const session = await auth();
  if (!session?.user?.id) return [];

  const documents = await prisma.document.findMany({
    where: { userId: session.user.id },
    select: { mimeType: true },
  });

  // Group by format
  const formatMap = new Map<string, number>();
  documents.forEach((doc) => {
    const format = doc.mimeType.split("/").pop()?.toUpperCase() || "UNKNOWN";
    formatMap.set(format, (formatMap.get(format) || 0) + 1);
  });

  return Array.from(formatMap.entries())
    .map(([format, count]) => ({ format, count }))
    .sort((a, b) => b.count - a.count);
}
