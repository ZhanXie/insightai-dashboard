import { requireAuth } from "@/lib/auth-guard";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// DELETE /api/documents/[id] - Delete a document and its chunks
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAuth();
  if ("response" in guard) return guard.response;
  const userId = guard.userId;

  const { id } = await params;

  // Verify ownership and delete (cascade will handle chunks)
  const document = await prisma.document.findFirst({
    where: { id, userId },
  });

  if (!document) {
    return NextResponse.json(
      { error: "Document not found" },
      { status: 404 }
    );
  }

  await prisma.document.delete({
    where: { id },
  });

  return NextResponse.json({ message: "Document deleted successfully" });
}
