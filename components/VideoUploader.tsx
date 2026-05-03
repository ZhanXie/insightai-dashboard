"use client";

import { useState, useCallback, useRef } from "react";
import { UploadIcon, Film, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { extractAudioFromVideo } from "@/lib/video-transcript/browser-audio-extractor";
import { uploadToQiniu } from "@/lib/storage/client-upload";

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
const ALLOWED_EXTENSIONS = [".mp4", ".mov", ".avi", ".webm", ".mkv"];

interface VideoUploaderProps {
  onUploadComplete?: (transcriptId: string) => void;
  onUploadError?: (error: string) => void;
}

export type UploadPhase =
  | "idle"
  | "loading-ffmpeg"
  | "extracting"
  | "uploading-video"
  | "uploading-audio"
  | "creating-record"
  | "done"
  | "error";

export interface UploadState {
  phase: UploadPhase;
  percent: number;
  message: string;
}

export default function VideoUploader({
  onUploadComplete,
  onUploadError,
}: VideoUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState>({
    phase: "idle",
    percent: 0,
    message: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateState = useCallback(
    (phase: UploadPhase, percent: number, message: string) => {
      setUploadState({ phase, percent, message });
    },
    []
  );

  const resetState = useCallback(() => {
    setUploadState({ phase: "idle", percent: 0, message: "" });
    setError(null);
    setSelectedFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const validateFile = useCallback(
    (file: File): string | null => {
      const ext = "." + file.name.split(".").pop()?.toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        return `Unsupported video format. Supported: ${ALLOWED_EXTENSIONS.join(", ")}`;
      }
      if (file.size > MAX_FILE_SIZE) {
        return "File size exceeds 500MB limit";
      }
      return null;
    },
    []
  );

  const processFile = useCallback(
    async (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        onUploadError?.(validationError);
        return;
      }

      setError(null);
      setSelectedFileName(file.name);
      updateState("loading-ffmpeg", 0, "Loading audio extractor...");

      try {
        // Phase 1: Extract audio from video using ffmpeg.wasm
        updateState("extracting", 0, "Extracting audio from video...");
        const audioBlob = await extractAudioFromVideo(file, (progress) => {
          if (progress.phase === "extracting") {
            updateState("extracting", progress.percent, "Extracting audio...");
          }
        });

        // Phase 2: Upload video via server proxy (raw binary, not FormData)
        const videoExt = file.name.split(".").pop() || "mp4";
        const audioExt = "wav";

        const videoKey = await uploadToQiniu(
          file,
          "video",
          videoExt,
          (pct) => updateState("uploading-video", pct, "Uploading video...")
        );

        updateState("uploading-audio", 0, "Uploading audio to storage...");
        const audioKey = await uploadToQiniu(
          audioBlob,
          "audio",
          audioExt,
          (pct) => updateState("uploading-audio", pct, "Uploading audio...")
        );

        // Phase 4: Create transcript record on server
        updateState("creating-record", 0, "Starting transcription...");

        const res = await fetch("/api/video-transcript/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: file.name,
            fileSize: file.size,
            mimeType: file.type || "video/mp4",
            videoKey,
            audioKey,
          }),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to create transcript record");
        }

        const data = await res.json();
        updateState("done", 100, "Transcription started!");

        setTimeout(() => {
          resetState();
          onUploadComplete?.(data.id);
        }, 1500);
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "An unexpected error occurred";
        setError(msg);
        updateState("error", 0, msg);
        onUploadError?.(msg);
        setTimeout(resetState, 4000);
      }
    },
    [validateFile, updateState, resetState, onUploadComplete, onUploadError]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
      e.target.value = "";
    },
    [processFile]
  );

  const isProcessing =
    uploadState.phase !== "idle" && uploadState.phase !== "done" && uploadState.phase !== "error";

  const getStatusIndicator = () => {
    switch (uploadState.phase) {
      case "loading-ffmpeg":
      case "extracting":
      case "uploading-video":
      case "uploading-audio":
      case "creating-record":
        return <Loader2 className="h-5 w-5 animate-spin text-primary" />;
      case "done":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      default:
        return <UploadIcon className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />;
    }
  };

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={`relative rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
          dragActive
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50"
        } ${isProcessing ? "pointer-events-none opacity-50" : ""}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".mp4,.mov,.avi,.webm,.mkv"
          onChange={handleFileSelect}
          disabled={isProcessing}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
        />

        <div className="text-muted-foreground">
          {isProcessing || uploadState.phase === "done" || uploadState.phase === "error" ? (
            <div className="flex flex-col items-center gap-3">
              {getStatusIndicator()}
              <div className="text-sm font-medium">
                {uploadState.message}
                {selectedFileName && (
                  <span className="block text-xs text-muted-foreground/60 mt-1">
                    {selectedFileName}
                  </span>
                )}
              </div>
              {isProcessing && uploadState.phase !== "loading-ffmpeg" && (
                <div className="w-full max-w-xs">
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-300"
                      style={{ width: `${Math.max(uploadState.percent, 5)}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground/60 flex justify-between">
                    <span>{uploadState.message}</span>
                    <span>{uploadState.percent}%</span>
                  </p>
                </div>
              )}
            </div>
          ) : (
            <>
              <Film className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
              <p className="text-sm">
                <span className="font-medium text-primary">Click to upload</span>{" "}
                or drag and drop
              </p>
              <p className="mt-1 text-xs text-muted-foreground/60">
                MP4, MOV, AVI, WebM, MKV (max 500MB)
              </p>
            </>
          )}
        </div>
      </div>

      {error && !isProcessing && (
        <div className="mt-2 rounded-md bg-destructive/10 p-2 text-sm text-destructive">
          {error}
        </div>
      )}
    </div>
  );
}
