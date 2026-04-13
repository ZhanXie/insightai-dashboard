import { requireAuth } from "@/lib/auth-guard";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/documents - List user's documents with pagination
export async function GET(request: Request) {
  const guard = await requireAuth();
  if ("response" in guard) return guard.response;
  const userId = guard.userId;

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const limit = parseInt(url.searchParams.get("limit") || "10", 10);
  const skip = (page - 1) * limit;

  const [documents, total] = await Promise.all([
    prisma.document.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        filename: true,
        fileSize: true,
        mimeType: true,
        status: true,
        chunkCount: true,
        createdAt: true,
      },
    }),
    prisma.document.count({
      where: { userId },
    }),
  ]);

  return NextResponse.json({
    documents,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
