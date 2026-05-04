import { auth } from "@/app/api/auth/[...nextauth]/auth";
import { prisma } from "@/lib/prisma";
import { getStorageProvider } from "@/lib/storage";
import VideoTranscriptClient from "./VideoTranscriptClient";

// Cache transcripts list for 30 seconds
export const revalidate = 30;

async function getTranscripts(userId: string) {
  const records = await prisma.videoTranscript.findMany({
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
      audioKey: true,
      videoKey: true,
      coverKey: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const provider = getStorageProvider();

  // Serialize Date fields to strings and add public URLs
  return records.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    audioUrl: r.audioKey ? provider.getPublicUrl(r.audioKey) : null,
    videoUrl: r.videoKey ? provider.getPublicUrl(r.videoKey) : null,
    coverUrl: r.coverKey ? provider.getPublicUrl(r.coverKey) : null,
  }));
}

export default async function VideoTranscriptPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const transcripts = await getTranscripts(session.user.id);

  return <VideoTranscriptClient initialTranscripts={transcripts} />;
}
