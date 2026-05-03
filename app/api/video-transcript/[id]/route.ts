import { withAuth } from "@/lib/http/handler";
import {
  getTranscript,
  deleteTranscript,
  triggerTranscription,
} from "@/lib/video-transcript/transcript-service";
import { ApiError } from "@/lib/http/api-error";

// GET /api/video-transcript/[id]
// Returns transcript details, including the transcript result
async function handleGet(req: Request, { userId }: { userId: string }) {
  const url = new URL(req.url);
  // Extract id from pathname: /api/video-transcript/<id>
  const id = url.pathname.split("/").pop();

  if (!id) {
    throw new ApiError(400, "Missing transcript ID");
  }

  const record = await getTranscript(id, userId);
  if (!record) {
    throw new ApiError(404, "Transcript not found");
  }

  return record;
}

// DELETE /api/video-transcript/[id]
// Deletes the transcript record and files from storage
async function handleDelete(req: Request, { userId }: { userId: string }) {
  const url = new URL(req.url);
  const id = url.pathname.split("/").pop();

  if (!id) {
    throw new ApiError(400, "Missing transcript ID");
  }

  const result = await deleteTranscript(id, userId);
  if (!result.deleted) {
    throw new ApiError(404, "Transcript not found");
  }

  return { success: true };
}

// POST /api/video-transcript/[id]
// Trigger transcription: { action: "transcribe" }
async function handlePost(req: Request, { userId }: { userId: string }) {
  const url = new URL(req.url);
  const id = url.pathname.split("/").pop();

  if (!id) {
    throw new ApiError(400, "Missing transcript ID");
  }

  const body = await req.json();
  const { action } = body as { action?: string };

  if (action === "transcribe") {
    await triggerTranscription(id, userId);
    return { success: true, message: "Transcription started" };
  }

  throw new ApiError(400, "Invalid action. Use 'transcribe' to start transcription");
}

export async function GET(request: Request) {
  return withAuth(handleGet)(request);
}

export async function DELETE(request: Request) {
  return withAuth(handleDelete)(request);
}

export async function POST(request: Request) {
  return withAuth(handlePost)(request);
}
