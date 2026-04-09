import { auth } from "@/app/api/auth/[...nextauth]/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Verify ownership
  const chatSession = await prisma.chatSession.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!chatSession) {
    return NextResponse.json(
      { error: "Chat session not found" },
      { status: 404 }
    );
  }

  // Delete session (cascade will handle messages)
  await prisma.chatSession.delete({
    where: { id },
  });

  return NextResponse.json({ message: "Chat session deleted successfully" });
}
