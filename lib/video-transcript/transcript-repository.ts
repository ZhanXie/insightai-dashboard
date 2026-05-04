// VideoTranscript repository service
// Encapsulates all Prisma queries related to video transcripts

import { prisma } from "@/lib/prisma";
import type { TranscriptSegment } from "./asr-client";

// Create a transcript record
export async function createTranscriptRecord(
  userId: string,
  filename: string,
  fileSize: number,
  mimeType: string,
  status: string = "pending"
) {
  return prisma.videoTranscript.create({
    data: {
      userId,
      filename,
      fileSize,
      mimeType,
      status,
    },
  });
}

// Update transcript status
export async function updateTranscriptStatus(
  id: string,
  status: string,
  extra?: { error?: string }
) {
  return prisma.videoTranscript.update({
    where: { id },
    data: {
      status,
      ...(extra?.error !== undefined && { error: extra.error }),
    },
  });
}

// Update transcript with storage keys
export async function updateTranscriptKeys(
  id: string,
  videoKey: string,
  audioKey: string,
  coverKey?: string
) {
  console.log(`[Repo] updateTranscriptKeys: id=${id}, videoKey=${videoKey}, audioKey=${audioKey}, coverKey=${coverKey}`);

  const updateData: { videoKey: string; audioKey: string; coverKey?: string } = {
    videoKey,
    audioKey,
  };
  if (coverKey) {
    updateData.coverKey = coverKey;
  }

  const result = await prisma.videoTranscript.update({
    where: { id },
    data: updateData,
  });

  console.log(`[Repo] updateTranscriptKeys result: videoKey=${result.videoKey}, audioKey=${result.audioKey}, coverKey=${result.coverKey}`);
  return result;
}

// Update transcript with ASR result
export async function updateTranscriptResult(
  id: string,
  segments: TranscriptSegment[],
  duration: number
) {
  const rawText = segments.map((s) => s.text).join("");

  return prisma.videoTranscript.update({
    where: { id },
    data: {
      transcript: JSON.parse(JSON.stringify(segments)),
      rawText,
      duration,
      status: "completed",
    },
  });
}

// Get a single transcript record (with ownership check)
export async function getTranscriptForUser(
  transcriptId: string,
  userId: string
) {
  return prisma.videoTranscript.findFirst({
    where: { id: transcriptId, userId },
    select: {
      id: true,
      filename: true,
      fileSize: true,
      mimeType: true,
      status: true,
      error: true,
      duration: true,
      transcript: true,
      rawText: true,
      videoKey: true,
      audioKey: true,
      coverKey: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

// Get a transcript by ID only (no ownership check)
export async function getTranscriptById(
  transcriptId: string,
  userId: string
) {
  return prisma.videoTranscript.findFirst({
    where: { id: transcriptId, userId },
    select: {
      id: true,
      audioKey: true,
      status: true,
    },
  });
}

// List all transcripts for a user (most recent first)
export async function listTranscripts(userId: string) {
  return prisma.videoTranscript.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      filename: true,
      fileSize: true,
      mimeType: true,
      status: true,
      error: true,
      duration: true,
      videoKey: true,
      audioKey: true,
      coverKey: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

// Delete a transcript record
export async function deleteTranscriptRecord(
  transcriptId: string,
  userId: string
) {
  return prisma.videoTranscript.deleteMany({
    where: { id: transcriptId, userId },
  });
}

// Count completed transcripts for a user
export async function countCompletedTranscripts(userId: string) {
  return prisma.videoTranscript.count({
    where: { userId, status: "completed" },
  });
}
