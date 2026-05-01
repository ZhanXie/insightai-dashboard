// Document validator service
// Validates MIME types and file sizes

import { ApiError } from "@/lib/http/api-error";

// Constants
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
export const ALLOWED_MIME_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "text/plain": "txt",
  "text/markdown": "md",
  "text/x-markdown": "md",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};

// Validate MIME type
export function validateMime(mimeType: string): { valid: boolean; format?: string } {
  if (ALLOWED_MIME_TYPES[mimeType]) {
    return { valid: true, format: ALLOWED_MIME_TYPES[mimeType] };
  }
  return { valid: false };
}

// Validate file size
export function validateSize(fileSize: number): boolean {
  return fileSize <= MAX_FILE_SIZE;
}

// Validate file extension as fallback
export function validateExtension(filename: string): { valid: boolean; mimeType?: string } {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (!ext) return { valid: false };

  const allowedExts = [".pdf", ".txt", ".md", ".docx"];
  if (allowedExts.some(allowedExt => filename.toLowerCase().endsWith(allowedExt))) {
    // Map extension to MIME type
    const extToMime: Record<string, string> = {
      ".pdf": "application/pdf",
      ".txt": "text/plain",
      ".md": "text/markdown",
      ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    };
    return { valid: true, mimeType: extToMime[`.${ext}`] };
  }
  return { valid: false };
}