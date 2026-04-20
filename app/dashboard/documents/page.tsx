import { auth } from "@/app/api/auth/[...nextauth]/auth";
import { prisma } from "@/lib/prisma";
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

function getStatusBadge(status: string) {
  const styles: Record<string, string> = {
    ready: "bg-green-100 text-green-800",
    processing: "bg-yellow-100 text-yellow-800",
    error: "bg-red-100 text-red-800",
    pending: "bg-gray-100 text-gray-800",
  };
  return (
    <span className={`rounded-full px-2 py-1 text-xs font-medium ${styles[status] || styles.pending}`}>
      {status}
    </span>
  );
}

export default async function DocumentsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const documents = await getDocuments(session.user.id);

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Documents</h1>
      </div>

      {/* Upload Section */}
      <div className="mb-8 rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-lg font-semibold">Upload Document</h2>
        <FileUpload />
      </div>

      {/* Documents List */}
      <div className="rounded-lg bg-white shadow">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold">Your Documents</h2>
        </div>

        {documents.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            <p className="text-lg">No documents uploaded yet</p>
            <p className="mt-1 text-sm">Upload your first document to start building your knowledge base.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between px-6 py-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{doc.filename}</span>
                    {getStatusBadge(doc.status)}
                  </div>
                  <div className="mt-1 text-sm text-gray-500">
                    {formatFileSize(doc.fileSize)} &middot; {doc.mimeType.split("/").pop()?.toUpperCase()}
                    {doc.chunkCount > 0 && ` &middot; ${doc.chunkCount} chunks`}
                    &middot; {new Date(doc.createdAt).toLocaleDateString()}
                  </div>
                </div>
                {doc.status === "ready" && (
                  <DeleteDocumentButton documentId={doc.id} filename={doc.filename} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
