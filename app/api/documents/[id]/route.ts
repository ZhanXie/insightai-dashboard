import { auth } from "@/app/api/auth/[...nextauth]/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// DELETE /api/documents/[id] - Delete a document and its chunks
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Verify ownership and delete (cascade will handle chunks)
  const document = await prisma.document.findFirst({
    where: { id, userId: session.user.id },
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
