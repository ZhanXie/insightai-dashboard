import { withAuth } from "@/lib/http/handler";
import { listUserTranscripts } from "@/lib/video-transcript/transcript-service";

// GET /api/video-transcript
// Returns all transcripts for the current user (most recent first)
export async function GET(request: Request) {
  return withAuth(async (req, { userId }) => {
    const transcripts = await listUserTranscripts(userId);
    return transcripts;
  })(request);
}
