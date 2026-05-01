"use client";

import { useState, useCallback } from "react";
import { UploadIcon } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = [
  "application/pdf",
  "text/plain",
  "text/markdown",
  "text/x-markdown",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const ALLOWED_EXTENSIONS = [".pdf", ".txt", ".md", ".docx"];

interface FileUploadProps {
  onUploadComplete?: (document: unknown) => void;
  onUploadError?: (error: string) => void;
}

export default function FileUpload({
  onUploadComplete,
  onUploadError,
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const validateFile = useCallback(
    (file: File): string | null => {
      if (
        !ALLOWED_TYPES.includes(file.type) &&
        !ALLOWED_EXTENSIONS.some((ext) =>
          file.name.toLowerCase().endsWith(ext)
        )
      ) {
        return `Unsupported file format. Supported: PDF, TXT, MD, DOCX`;
      }
      if (file.size > MAX_FILE_SIZE) {
        return "File size exceeds 50MB limit";
      }
      return null;
    },
    []
  );

  const handleUpload = useCallback(
    async (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        onUploadError?.(validationError);
        return;
      }

      setUploading(true);
      setProgress(0);
      setError(null);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/documents/upload");

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            setProgress(Math.round((event.loaded / event.total) * 100));
          }
        };

        xhr.onload = () => {
          setUploading(false);
          if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            onUploadComplete?.(response);
          } else {
            const errorData = JSON.parse(xhr.responseText);
            const errorMsg = errorData.error || "Upload failed";
            setError(errorMsg);
            onUploadError?.(errorMsg);
          }
        };

        xhr.onerror = () => {
          setUploading(false);
          const errorMsg = "Network error during upload";
          setError(errorMsg);
          onUploadError?.(errorMsg);
        };

        xhr.send(formData);
      } catch {
        setUploading(false);
        const errorMsg = "An unexpected error occurred";
        setError(errorMsg);
        onUploadError?.(errorMsg);
      }
    },
    [validateFile, onUploadComplete, onUploadError]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files[0];
      if (file) {
        handleUpload(file);
      }
    },
    [handleUpload]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleUpload(file);
      }
    },
    [handleUpload]
  );

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={`relative rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
          dragActive
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50"
        } ${uploading ? "pointer-events-none opacity-50" : ""}`}
      >
        <input
          type="file"
          accept=".pdf,.txt,.md,.docx"
          onChange={handleFileSelect}
          disabled={uploading}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
        />
        <div className="text-muted-foreground">
          <UploadIcon className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
          <p className="text-sm">
            {uploading ? (
              <span>Uploading... {progress}%</span>
            ) : (
              <>
                <span className="font-medium text-primary">
                  Click to upload
                </span>{" "}
                or drag and drop
              </>
            )}
          </p>
          <p className="mt-1 text-xs text-muted-foreground/60">
            PDF, TXT, MD, DOCX (max 50MB)
          </p>
        </div>
      </div>

      {uploading && (
        <Progress value={progress} className="mt-2" />
      )}

      {error && (
        <div className="mt-2 rounded-md bg-destructive/10 p-2 text-sm text-destructive">
          {error}
        </div>
      )}
    </div>
  );
}
