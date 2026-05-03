import { withAuth } from "@/lib/http/handler";
import { getStorageProvider } from "@/lib/storage";
import { ApiError } from "@/lib/http/api-error";
import crypto from "crypto";

// POST /api/qiniu-token
// Server-side token generation for client direct upload to Qiniu.
// Uses QiniuStorageProvider.generateUploadToken() (pure crypto, no SDK needed).
// The client uses qiniu-js to upload directly.
export const POST = withAuth(async (req, { userId }) => {
  let body: { fileType?: string; extension?: string };

  try {
    body = await req.json();
  } catch {
    throw new ApiError(400, "Invalid JSON body");
  }

  const { fileType, extension } = body;

  if (!fileType || !extension) {
    throw new ApiError(400, "Missing required fields: fileType, extension");
  }

  // Generate unique key
  const uuid = crypto.randomUUID();
  const key = `transcripts/${userId}/${uuid}_${fileType}.${extension}`;

  // Generate upload token using QiniuStorageProvider (pure crypto)
  const provider = getStorageProvider();
  const token = await provider.generateUploadToken(key);

  return { token, key };
});
