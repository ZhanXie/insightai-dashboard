// ASR client — calls DashScope paraformer-v2 via official async API
// Uses DashScope official REST API with async_call + wait_for_completion

import { OPENAI_COMPATIBLE_API_KEY, OPENAI_ASR_MODEL } from "@/lib/env";

export interface TranscriptSegment {
  /** Start time in seconds */
  start: number;
  /** End time in seconds */
  end: number;
  /** Transcribed text */
  text: string;
}

export interface AsrResult {
  segments: TranscriptSegment[];
  /** Full text joined from segments */
  fullText: string;
}

const DASCOPE_API_URL = "https://dashscope.aliyuncs.com/api/v1/services/audio/asr/transcription";

/**
 * Transcribe an audio file by providing its public URL.
 * Uses DashScope official async API (async_call + wait_for_completion).
 */
export async function transcribeByUrl(audioUrl: string): Promise<AsrResult> {
  // Step 1: Submit async transcription task
  const submitPayload = {
    model: OPENAI_ASR_MODEL,
    input: {
      file_urls: [audioUrl],
    },
    parameters: {
      language_hints: ["zh", "en"],
      enabled_phrase: true,
    },
  };

  const submitResponse = await fetch(DASCOPE_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_COMPATIBLE_API_KEY}`,
      "Content-Type": "application/json",
      "X-DashScope-Async": "enable", // Required for async mode
    },
    body: JSON.stringify(submitPayload),
  });

  if (!submitResponse.ok) {
    const errBody = await submitResponse.text();
    throw new Error(
      `DashScope submit error (${submitResponse.status}): ${errBody.slice(0, 500)}`
    );
  }

  const submitData = await submitResponse.json() as Record<string, unknown>;
  const taskId = (submitData.output as Record<string, unknown>)?.task_id as string;

  if (!taskId) {
    throw new Error("Invalid DashScope response: missing task_id");
  }

  // Step 2: Poll for task completion
  const taskStatusUrl = `https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`;
  const MAX_ATTEMPTS = 60; // 5 minutes max (60 * 5s)
  const POLL_INTERVAL = 5000; // 5 seconds

  let result: Record<string, unknown> | null = null;

  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));

    const statusResponse = await fetch(taskStatusUrl, {
      headers: {
        Authorization: `Bearer ${OPENAI_COMPATIBLE_API_KEY}`,
      },
    });

    if (!statusResponse.ok) {
      console.warn(`Failed to fetch task status: ${statusResponse.status}`);
      continue;
    }

    const statusData = await statusResponse.json() as Record<string, unknown>;
    const taskStatus = ((statusData.output as Record<string, unknown>)?.task_status as string) ?? "";

    if (taskStatus === "SUCCEEDED") {
      result = statusData;
      break;
    } else if (taskStatus === "FAILED" || taskStatus === "CANCELED") {
      throw new Error(
        `DashScope transcription task failed with status: ${taskStatus}. Output: ${JSON.stringify(statusData.output).slice(0, 300)}`
      );
    }
    // Otherwise: RUNNING, PENDING — continue polling
  }

  if (!result) {
    throw new Error("DashScope transcription timed out after 5 minutes");
  }

  // Step 3: Get the transcription result URL from results array
  const output = (result.output as Record<string, unknown>) ?? {};
  const results = (output.results as Array<Record<string, unknown>> | undefined) ?? [];

  if (results.length === 0) {
    throw new Error("DashScope response: no results found");
  }

  const transcriptionUrl = results[0]?.transcription_url as string | undefined;
  if (!transcriptionUrl) {
    throw new Error("DashScope response: missing transcription_url");
  }

  // Step 4: Fetch the actual transcription result from the provided URL
  const transcriptionResponse = await fetch(transcriptionUrl);
  if (!transcriptionResponse.ok) {
    throw new Error(
      `Failed to fetch transcription result: ${transcriptionResponse.status}`
    );
  }

  const transcriptionData = await transcriptionResponse.json() as Record<string, unknown>;

  let fullText = (transcriptionData.text as string) ?? "";
  const segments: TranscriptSegment[] = [];

  // DashScope paraformer async format: transcripts[].sentences[]
  const transcripts = transcriptionData.transcripts as Array<Record<string, unknown>> | undefined;
  if (transcripts) {
    for (const t of transcripts) {
      // Collect full text from each transcript
      const tText = (t.text as string) ?? "";
      if (tText) fullText = fullText || tText;

      // Extract sentences from each transcript
      const sentences = t.sentences as Array<Record<string, unknown>> | undefined;
      if (sentences) {
        for (const s of sentences) {
          segments.push({
            start: ((s.begin_time ?? s.startTime ?? 0) as number) / 1000,
            end: ((s.end_time ?? s.endTime ?? 0) as number) / 1000,
            text: ((s.text ?? s.content ?? "") as string).trim(),
          });
        }
      }
    }
  }

  // Fallback: Try top-level sentences
  if (segments.length === 0) {
    const sentences = transcriptionData.sentences as Array<Record<string, unknown>> | undefined;
    if (sentences) {
      for (const s of sentences) {
        segments.push({
          start: ((s.begin_time ?? s.startTime ?? 0) as number) / 1000,
          end: ((s.end_time ?? s.endTime ?? 0) as number) / 1000,
          text: ((s.text ?? s.content ?? "") as string).trim(),
        });
      }
    }
  }

  // Fallback: Try segments directly
  if (segments.length === 0) {
    const segs = transcriptionData.segments as Array<Record<string, unknown>> | undefined;
    if (segs) {
      for (const s of segs) {
        segments.push({
          start: ((s.start ?? s.begin_time ?? 0) as number),
          end: ((s.end ?? s.end_time ?? 0) as number),
          text: ((s.text ?? s.content ?? "") as string).trim(),
        });
      }
    }
  }

  console.log(`[ASR] Extracted ${segments.length} segments, fullText length: ${fullText.length}`);

  return {
    segments,
    fullText: fullText || segments.map((s) => s.text).join(" "),
  };
}
