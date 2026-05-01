import { withAuth } from "@/lib/http/handler";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  return withAuth(async (req, { userId }) => {
    const url = new URL(req.url);
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

    return {
      documents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  })(request);
}
