import { withAuth } from "@/lib/http/handler";
import { createTranscript, isAllowedVideoType } from "@/lib/video-transcript/transcript-service";
import { getStorageProvider } from "@/lib/storage";
import { ApiError } from "@/lib/http/api-error";

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

// POST /api/video-transcript/upload
// After the browser has uploaded video + audio to Qiniu,
// this endpoint creates the transcript record and starts ASR processing.
// Body: { filename, fileSize, mimeType, videoKey, audioKey }
export async function POST(request: Request) {
  return withAuth(async (req, { userId }) => {
    const body = await req.json();
    const { filename, fileSize, mimeType, videoKey, audioKey, coverKey } = body as {
      filename?: string;
      fileSize?: number;
      mimeType?: string;
      videoKey?: string;
      audioKey?: string;
      coverKey?: string;
    };

    // Validation
    if (!filename || !fileSize || !mimeType || !videoKey || !audioKey) {
      throw new ApiError(400, "Missing required fields: filename, fileSize, mimeType, videoKey, audioKey");
    }

    if (fileSize > MAX_FILE_SIZE) {
      throw new ApiError(400, "File size exceeds 500MB limit");
    }

    if (!isAllowedVideoType(mimeType, filename)) {
      throw new ApiError(400, "Unsupported video format. Supported: MP4, MOV, AVI, WebM, MKV");
    }

    const result = await createTranscript({
      userId,
      filename,
      fileSize,
      mimeType,
      videoKey,
      audioKey,
      coverKey,
    });

    console.log(`[Upload API] Transcript created: id=${result.id}, coverKey=${coverKey}`);

    const provider = getStorageProvider();

    return {
      id: result.id,
      audioUrl: provider.getPublicUrl(audioKey),
      videoUrl: provider.getPublicUrl(videoKey),
      coverUrl: coverKey ? provider.getPublicUrl(coverKey) : null,
    };
  })(request);
}
