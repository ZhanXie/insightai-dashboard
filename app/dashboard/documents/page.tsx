import { auth } from "@/app/api/auth/[...nextauth]/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import FileUpload from "@/components/FileUpload";
import DeleteDocumentButton from "@/components/DeleteDocumentButton";

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

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "ready": return "default";
    case "processing": return "secondary";
    case "error": return "destructive";
    default: return "outline";
  }
}

export default async function DocumentsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const documents = await getDocuments(session.user.id);

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Documents</h1>
      </div>

      {/* Upload Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Upload Document</CardTitle>
        </CardHeader>
        <CardContent>
          <FileUpload />
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Documents</CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <p className="text-lg">No documents uploaded yet</p>
              <p className="mt-1 text-sm">
                Upload your first document to start building your knowledge base.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="font-medium truncate">{doc.filename}</span>
                      <Badge variant={getStatusVariant(doc.status)}>
                        {doc.status}
                      </Badge>
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {formatFileSize(doc.fileSize)} &middot;{" "}
                      {doc.mimeType.split("/").pop()?.toUpperCase()}
                      {doc.chunkCount > 0 && ` \u00b7 ${doc.chunkCount} chunks`}
                      &middot; {new Date(doc.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  {doc.status === "ready" && (
                    <DeleteDocumentButton
                      documentId={doc.id}
                      filename={doc.filename}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
