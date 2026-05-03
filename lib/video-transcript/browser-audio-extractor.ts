// Client-side audio extractor using ffmpeg.wasm
// Extracts 16kHz mono WAV audio from video in the browser

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

let ffmpeg: FFmpeg | null = null;
let ffmpegLoaded = false;

/**
 * Get or initialize the FFmpeg WASM instance.
 * Loads the core (~28MB) on first call — subsequent calls use cache.
 */
async function getFFmpeg(): Promise<FFmpeg> {
  if (!ffmpeg) {
    ffmpeg = new FFmpeg();
  }
  if (!ffmpegLoaded) {
    await ffmpeg.load();
    ffmpegLoaded = true;
  }
  return ffmpeg;
}

export interface ExtractionProgress {
  phase: "loading" | "extracting" | "done";
  /** 0-100 percentage */
  percent: number;
}

export type ProgressCallback = (progress: ExtractionProgress) => void;

/**
 * Extract audio from a video file.
 * Returns a WAV Blob (16kHz, mono) ready for upload.
 */
export async function extractAudioFromVideo(
  videoFile: File,
  onProgress?: ProgressCallback
): Promise<Blob> {
  onProgress?.({ phase: "loading", percent: 0 });

  const instance = await getFFmpeg();

  onProgress?.({ phase: "loading", percent: 50 });

  // Write input file to FFmpeg's virtual filesystem
  instance.writeFile("input", await fetchFile(videoFile));

  onProgress?.({ phase: "extracting", percent: 0 });

  // Track progress via FFmpeg's progress events
  instance.on("progress", ({ progress: pct }) => {
    onProgress?.({ phase: "extracting", percent: Math.round(pct * 100) });
  });

  // Extract audio: 16kHz mono WAV
  await instance.exec([
    "-i",
    "input",
    "-vn", // drop video
    "-ar", "16000", // 16kHz sample rate
    "-ac", "1", // mono
    "-f", "wav", // WAV format
    "output.wav",
  ]);

  // Clean up input file from virtual FS
  instance.deleteFile("input");

  // Read output
  const data = (await instance.readFile("output.wav")) as Uint8Array;
  instance.deleteFile("output.wav");

  const blob = new Blob([new Uint8Array(data)], { type: "audio/wav" });

  onProgress?.({ phase: "done", percent: 100 });

  return blob;
}
