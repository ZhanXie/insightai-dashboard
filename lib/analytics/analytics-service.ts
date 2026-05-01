// Analytics service
// SQL-based aggregation for dashboard analytics

import { prisma } from "@/lib/prisma";

// Get dashboard statistics
export async function getDashboardStats(userId: string) {
  const [totalDocuments, totalChunks, totalSessions, totalMessages] = await Promise.all([
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

// Get documents over time (daily)
export async function getDocumentsOverTime(userId: string) {
  const documents = await prisma.$queryRaw<
    Array<{ date: Date; count: bigint }>
  >`
    SELECT date_trunc('day', created_at)::date as date, count(*) as count
    FROM documents
    WHERE user_id = ${userId}::text
    GROUP BY date
    ORDER BY date
  `;

  return documents.map((row) => ({
    date: row.date.toISOString().split("T")[0],
    count: Number(row.count),
  }));
}

// Get chat activity (last 30 days)
export async function getChatActivity(userId: string) {
  const messages = await prisma.$queryRaw<
    Array<{ date: Date; count: bigint }>
  >`
    SELECT date_trunc('day', created_at)::date as date, count(*) as count
    FROM messages
    WHERE session_id IN (SELECT id FROM chat_sessions WHERE user_id = ${userId}::text)
    AND created_at >= NOW() - INTERVAL '30 days'
    GROUP BY date
    ORDER BY date
  `;

  return messages.map((row) => ({
    date: row.date.toISOString().split("T")[0],
    count: Number(row.count),
  }));
}

// Get document format distribution
export async function getDocumentFormatDistribution(userId: string) {
  const documents = await prisma.$queryRaw<
    Array<{ format: string; count: bigint }>
  >`
    SELECT split_part(mime_type, '/', -1) as format, count(*) as count
    FROM documents
    WHERE user_id = ${userId}::text
    GROUP BY format
    ORDER BY count DESC
  `;

  return documents.map((row) => ({
    format: row.format.toUpperCase(),
    count: Number(row.count),
  }));
}