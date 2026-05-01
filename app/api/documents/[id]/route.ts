import { withAuth } from "@/lib/http/handler";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/http/api-error";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  return withAuth(async (_req, { userId }) => {
    const document = await prisma.document.findFirst({
      where: { id, userId },
    });

    if (!document) {
      throw new ApiError(404, "Document not found");
    }

    await prisma.document.delete({
      where: { id },
    });

    return { message: "Document deleted successfully" };
  })(request);
}
