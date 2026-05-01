"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import FileUpload from "@/components/FileUpload";
import DeleteDocumentButton from "@/components/DeleteDocumentButton";
import { Loader2, FileText, CheckCircle, AlertCircle } from "lucide-react";

interface Document {
  id: string;
  filename: string;
  fileSize: number;
  mimeType: string;
  status: string;
  chunkCount: number;
  createdAt: Date;
}

interface DocumentsClientProps {
  initialDocuments: Document[];
}

interface UploadResponse {
  id: string;
  filename: string;
  status: string;
  chunkCount: number;
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

export default function DocumentsClient({ initialDocuments }: DocumentsClientProps) {
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>(initialDocuments);

  // 当 Server Component 重新渲染并传入新的 initialDocuments 时，更新本地 state
  useEffect(() => {
    setDocuments(initialDocuments);
  }, [initialDocuments]);

  const handleUploadComplete = (response: unknown) => {
    // 上传完成后，将新文档添加到列表
    const doc = response as UploadResponse;
    const newDoc: Document = {
      id: doc.id,
      filename: doc.filename,
      fileSize: 0, // 上传响应中没有返回 fileSize
      mimeType: "",
      status: doc.status,
      chunkCount: doc.chunkCount,
      createdAt: new Date(),
    };
    setDocuments((prev) => [newDoc, ...prev]);
    
    // 同时触发 router.refresh 确保服务端状态同步
    router.refresh();
  };

  const handleDelete = (documentId: string) => {
    // 从列表中移除已删除的文档
    setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
  };

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
          <FileUpload onUploadComplete={handleUploadComplete} />
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
                      onDeleted={() => handleDelete(doc.id)}
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
