import { auth } from "@/app/api/auth/[...nextauth]/auth";
import { prisma } from "@/lib/prisma";
import DocumentsClient from "./DocumentsClient";

// Cache documents list for 30 seconds
export const revalidate = 30;

async function getDocuments(userId: string) {
  return prisma.document.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      filename: true,
      fileSize: true,
      mimeType: true,
      status: true,
      chunkCount: true,
      createdAt: true,
    },
  });
}

export default async function DocumentsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const documents = await getDocuments(session.user.id);

  return <DocumentsClient initialDocuments={documents} />;
}
