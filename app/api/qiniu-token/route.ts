import { withAuth } from "@/lib/http/handler";
import { getStorageProvider } from "@/lib/storage";
import { ApiError } from "@/lib/http/api-error";
import { APP_ENV } from "@/lib/env";
import crypto from "crypto";

// POST /api/qiniu-token
// Server-side token generation for client direct upload to Qiniu.
// Uses QiniuStorageProvider.generateUploadToken() (pure crypto, no SDK needed).
// The client uses qiniu-js to upload directly.
export const POST = withAuth(async (req, { userId }) => {
  let body: { fileType?: string; extension?: string; filename?: string; uploadId?: string };

  try {
    body = await req.json();
  } catch {
    throw new ApiError(400, "Invalid JSON body");
  }

  const { fileType, extension, filename, uploadId } = body;

  if (!fileType || !extension) {
    throw new ApiError(400, "Missing required fields: fileType, extension");
  }

  // Use client-provided ID or generate a new one
  const id = uploadId || crypto.randomUUID();
  const envPrefix = APP_ENV;

  // If filename is provided, sanitize it for use in the path (max 30 chars)
  const baseName = filename
    ? filename.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9\u4e00-\u9fa5_-]/g, "_").slice(0, 30)
    : "";

  // Unique ID always goes first in the filename to avoid truncation issues
  // Format: {env}/transcripts/{userId}/{uniqueId}/{uniqueId}_{fileType}[_basename].{ext}
  const fileNamePart = baseName
    ? `${fileType}_${baseName}.${extension}`
    : `${fileType}.${extension}`;
  const key = `${envPrefix}/transcripts/${userId}/${id}_${baseName}/${fileNamePart}`;

  // Generate upload token using QiniuStorageProvider (pure crypto)
  const provider = getStorageProvider();
  const token = await provider.generateUploadToken(key);

  return { token, key };
});
