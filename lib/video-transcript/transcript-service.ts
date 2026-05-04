// Video transcript service — orchestrates the full pipeline
// Flow: create record → (manual trigger) → ASR via audio URL → save result
// Video and audio are uploaded directly from browser to Qiniu

import {
  createTranscriptRecord,
  updateTranscriptStatus,
  updateTranscriptKeys,
  updateTranscriptResult,
  getTranscriptForUser,
  listTranscripts,
  deleteTranscriptRecord,
  getTranscriptById,
} from "./transcript-repository";
import { transcribeByUrl } from "./asr-client";
import { getStorageProvider } from "@/lib/storage";
import { prisma } from "@/lib/prisma";

const ALLOWED_MIME_TYPES = [
  "video/mp4",
  "video/quicktime",    // .mov
  "video/x-msvideo",    // .avi
  "video/webm",
  "video/x-matroska",   // .mkv
];

const ALLOWED_EXTENSIONS = [".mp4", ".mov", ".avi", ".webm", ".mkv"];

export function isAllowedVideoType(
  mimeType: string,
  filename: string
): boolean {
  if (ALLOWED_MIME_TYPES.includes(mimeType)) return true;
  const ext = filename.split(".").pop()?.toLowerCase();
  return ext ? ALLOWED_EXTENSIONS.includes(`.${ext}`) : false;
}

export interface CreateTranscriptParams {
  userId: string;
  filename: string;
  fileSize: number;
  mimeType: string;
  videoKey: string;
  audioKey: string;
  coverKey?: string;
}

// Step 1: Create the transcript record (status: "pending")
export async function createTranscript(
  params: CreateTranscriptParams
): Promise<{ id: string }> {
  // Verify user exists before creating transcript
  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { id: true },
  });

  if (!user) {
    throw new Error(`User ${params.userId} not found in database`);
  }

  const record = await createTranscriptRecord(
    params.userId,
    params.filename,
    params.fileSize,
    params.mimeType,
    "pending"
  );

  await updateTranscriptKeys(record.id, params.videoKey, params.audioKey, params.coverKey);

  // NOTE: Transcription is NOT started automatically.
  // User must trigger it manually via POST /api/video-transcript/[id]/transcribe

  return { id: record.id };
}

// Step 2: Trigger ASR transcription (manual)
export async function triggerTranscription(id: string, userId: string): Promise<void> {
  const record = await getTranscriptById(id, userId);
  if (!record) {
    throw new Error("Transcript not found");
  }

  if (!record.audioKey) {
    throw new Error("Audio file not available for transcription");
  }

  // Update status to processing
  await updateTranscriptStatus(id, "processing");

  // Start ASR processing asynchronously
  processTranscript(id, record.audioKey).catch((err) => {
    console.error(`[VideoTranscript] Processing failed for ${id}:`, err);
  });
}

// Step 2 (async): Process the transcript — calls ASR and saves results
async function processTranscript(
  id: string,
  audioKey: string
): Promise<void> {
  try {
    const provider = getStorageProvider();
    const audioUrl = provider.getPublicUrl(audioKey);

    console.log(`[VideoTranscript] Starting ASR for ${id}, audio URL: ${audioUrl}`);

    const result = await transcribeByUrl(audioUrl);

    console.log(
      `[VideoTranscript] ASR completed for ${id}: ${result.segments.length} segments`
    );

    // Duration is the last segment's end time
    const duration =
      result.segments.length > 0
        ? result.segments[result.segments.length - 1].end
        : 0;

    await updateTranscriptResult(id, result.segments, duration);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown processing error";
    console.error(`[VideoTranscript] Error processing ${id}:`, message);
    await updateTranscriptStatus(id, "error", { error: message });
  }
}

// Query helpers
export async function getTranscript(transcriptId: string, userId: string) {
  const record = await getTranscriptForUser(transcriptId, userId);
  if (!record) return null;

  const provider = getStorageProvider();

  return {
    ...record,
    audioUrl: record.audioKey ? provider.getPublicUrl(record.audioKey) : null,
    videoUrl: record.videoKey ? provider.getPublicUrl(record.videoKey) : null,
    coverUrl: record.coverKey ? provider.getPublicUrl(record.coverKey) : null,
  };
}

export async function listUserTranscripts(userId: string) {
  const records = await listTranscripts(userId);
  const provider = getStorageProvider();

  return records.map((record) => ({
    ...record,
    audioUrl: record.audioKey ? provider.getPublicUrl(record.audioKey) : null,
    videoUrl: record.videoKey ? provider.getPublicUrl(record.videoKey) : null,
    coverUrl: record.coverKey ? provider.getPublicUrl(record.coverKey) : null,
  }));
}

export async function deleteTranscript(transcriptId: string, userId: string) {
  // Fetch the record to get storage keys
  const record = await getTranscriptForUser(transcriptId, userId);
  if (!record) return { deleted: false };

  const provider = getStorageProvider();

  // Delete video file from Qiniu
  if (record.videoKey) {
    try {
      await provider.deleteFile(record.videoKey);
      console.log(`[Storage] Deleted video: ${record.videoKey}`);
    } catch (err) {
      console.warn(`[Storage] Failed to delete video ${record.videoKey}:`, err);
    }
  }

  // Delete audio file from Qiniu
  if (record.audioKey) {
    try {
      await provider.deleteFile(record.audioKey);
      console.log(`[Storage] Deleted audio: ${record.audioKey}`);
    } catch (err) {
      console.warn(`[Storage] Failed to delete audio ${record.audioKey}:`, err);
    }
  }

  // Delete cover image from Qiniu
  if (record.coverKey) {
    try {
      await provider.deleteFile(record.coverKey);
      console.log(`[Storage] Deleted cover: ${record.coverKey}`);
    } catch (err) {
      console.warn(`[Storage] Failed to delete cover ${record.coverKey}:`, err);
    }
  }

  // Delete DB record
  const result = await deleteTranscriptRecord(transcriptId, userId);
  return { deleted: result.count > 0 };
}
