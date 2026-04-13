import { requireAuth } from "@/lib/auth-guard";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAuth();
  if ("response" in guard) return guard.response;
  const userId = guard.userId;

  const { id } = await params;

  // Verify ownership
  const chatSession = await prisma.chatSession.findFirst({
    where: { id, userId },
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
