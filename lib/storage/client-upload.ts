// Client-side upload helper for direct-to-Qiniu upload
// Uses the official qiniu-js SDK (v3.x) for reliable multipart upload.
// Server only generates the token + key path; the client uploads directly to Qiniu,
// completely bypassing Next.js App Router body parsing and size limits.
import { upload, region as qiniuRegion } from "qiniu-js";

type QiniuRegion = (typeof qiniuRegion)[keyof typeof qiniuRegion];

// Upload region — adjust based on your bucket's zone
// z0=华东, z1=华北, z2=华南, na0=北美, as0=新加坡(东南亚), cn-east-2=华东2
const UPLOAD_REGION: QiniuRegion = qiniuRegion.as0;

/**
 * Ensure the blob is a File (qiniu-js needs .name on the blob).
 */
function toFile(blob: Blob, filename: string): File {
  if (blob instanceof File) return blob;
  return new File([blob], filename, { type: blob.type });
}

/**
 * Request an upload token from the server, then upload a file directly to Qiniu
 * using qiniu-js SDK (supports resumable upload with progress).
 * @param file - The blob/file to upload
 * @param fileType - "video" or "audio"
 * @param extension - File extension (e.g. "mp4", "wav")
 * @param onProgress - Optional upload progress callback (0-100)
 * @param filename - Original filename for grouping files under the same directory
 * @param uploadId - Shared ID for all files from the same upload batch
 * @returns The Qiniu key assigned by the server
 */
export function uploadToQiniu(
  blob: Blob,
  fileType: string,
  extension: string,
  onProgress?: (pct: number) => void,
  filename?: string,
  uploadId?: string
): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      // 1. Get upload token + key from server
      const tokenRes = await fetch("/api/qiniu-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileType, extension, filename, uploadId }),
      });

      if (!tokenRes.ok) {
        const err = await tokenRes.json();
        reject(new Error(err.error || "Failed to get upload token"));
        return;
      }

      const { token, key } = (await tokenRes.json()) as {
        token: string;
        key: string;
      };

      // 2. Convert Blob → File if needed (qiniu-js needs .name)
      const internalFilename = `${fileType}.${extension}`;
      const file = toFile(blob, internalFilename);

      // 3. Upload directly to Qiniu via qiniu-js
      const config = {
        useCdnDomain: true,
        region: UPLOAD_REGION,
      };

      const putExtra = {};

      const observable = upload(file, key, token, putExtra, config);

      observable.subscribe({
        next: (res) => {
          const pct = res.total.percent;
          onProgress?.(Math.round(pct));
        },
        error: (err) => {
          const errorMsg =
            err instanceof Error ? err.message :
            typeof err === "object" && err !== null ? JSON.stringify(err) :
            String(err);
          reject(new Error(errorMsg));
        },
        complete: (res) => {
          resolve((res as { key?: string }).key || key);
        },
      });
    } catch (err) {
      reject(err instanceof Error ? err : new Error("Unexpected upload error"));
    }
  });
}
