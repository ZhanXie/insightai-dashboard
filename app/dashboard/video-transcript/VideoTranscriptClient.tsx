"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import VideoUploader from "@/components/VideoUploader";
import TranscriptViewer from "@/components/TranscriptViewer";
import { useToast } from "@/components/ui/ToastProvider";
import {
  Loader2,
  Eye,
  EyeOff,
  Trash2,
  FileVideo,
  Headphones,
  Download,
  Play,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader,
  RefreshCw,
} from "lucide-react";

export interface TranscriptRecord {
  id: string;
  filename: string;
  fileSize: number;
  mimeType: string;
  status: string;
  error?: string | null;
  duration?: number | null;
  audioUrl?: string | null;
  videoUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TranscriptDetail extends TranscriptRecord {
  transcript?: { start: number; end: number; text: string }[] | null;
  rawText?: string | null;
  videoKey?: string | null;
  audioKey?: string | null;
}

interface VideoTranscriptClientProps {
  initialTranscripts: TranscriptRecord[];
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function VideoTranscriptClient({
  initialTranscripts,
}: VideoTranscriptClientProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [transcripts, setTranscripts] =
    useState<TranscriptRecord[]>(initialTranscripts);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detailCache, setDetailCache] = useState<Record<string, TranscriptDetail>>({});
  const [loadingDetail, setLoadingDetail] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [transcribingId, setTranscribingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    router.refresh();
    setTimeout(() => setRefreshing(false), 1000);
  }, [router]);

  // Auto-polling for transcription status (when user clicks transcribe)
  const startPolling = useCallback((id: string) => {
    if (pollingRef.current) clearInterval(pollingRef.current);

    let pollCount = 0;
    const MAX_POLLS = 12; // 60 seconds max

    pollingRef.current = setInterval(async () => {
      pollCount += 1;

      try {
        const res = await fetch(`/api/video-transcript/${id}`);
        if (!res.ok) {
          console.error("Failed to fetch transcript status");
          return;
        }
        const data = (await res.json()) as TranscriptRecord;

        // Update local state with real status from server
        setTranscripts((prev) =>
          prev.map((t) => (t.id === data.id ? data : t))
        );

        // Stop polling if done or error
        if (data.status === "completed" || data.status === "error") {
          if (pollingRef.current) clearInterval(pollingRef.current);
          pollingRef.current = null;
          setTranscribingId(null);

          if (data.status === "completed") {
            addToast("Transcription completed!", "success");
          } else if (data.status === "error") {
            addToast(`Transcription failed: ${data.error || "Unknown error"}`, "destructive");
          }
        }
      } catch (err) {
        console.error("Polling error:", err);
      }

      // Stop after max polls
      if (pollCount >= MAX_POLLS) {
        if (pollingRef.current) clearInterval(pollingRef.current);
        pollingRef.current = null;
        setTranscribingId(null);
        addToast("Polling timeout — refresh manually to check status", "default");
      }
    }, 5000);

    // Immediate first poll
    setTimeout(async () => {
      try {
        const res = await fetch(`/api/video-transcript/${id}`);
        if (!res.ok) return;
        const data = (await res.json()) as TranscriptRecord;
        setTranscripts((prev) =>
          prev.map((t) => (t.id === data.id ? data : t))
        );
      } catch {
        // Ignore
      }
    }, 2000);
  }, [addToast]);

  const handleTranscribe = useCallback(
    async (id: string) => {
      setTranscribingId(id);
      try {
        const res = await fetch(`/api/video-transcript/${id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "transcribe" }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to start transcription");
        }
        addToast("Transcription started — status will update automatically", "success");
        // Start polling for real status
        startPolling(id);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to start transcription";
        addToast(msg, "destructive");
        setTranscribingId(null);
      }
    },
    [addToast, startPolling]
  );

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, []);

  const fetchDetail = useCallback(
    async (id: string) => {
      // Check cache first
      if (detailCache[id]) return;

      setLoadingDetail(id);
      try {
        const res = await fetch(`/api/video-transcript/${id}`);
        if (!res.ok) throw new Error("Failed to fetch transcript");
        const data = (await res.json()) as TranscriptDetail;
        setDetailCache((prev) => ({ ...prev, [id]: data }));
      } catch (err) {
        addToast(
          err instanceof Error ? err.message : "Failed to load transcript",
          "destructive"
        );
      } finally {
        setLoadingDetail(null);
      }
    },
    [detailCache, addToast]
  );

  const handleToggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      fetchDetail(id);
    }
  };

  const handleUploadComplete = (transcriptId: string) => {
    // Fetch the newly created transcript and add it to the list immediately
    fetch(`/api/video-transcript/${transcriptId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch transcript");
        return res.json() as Promise<TranscriptRecord>;
      })
      .then((record) => {
        setTranscripts((prev) => [record, ...prev]);
      })
      .catch((err) => {
        console.error("Failed to fetch new transcript:", err);
        // Fallback to full refresh
        router.refresh();
      });

    // Refresh again after 3s to get updated status (ASR may have completed)
    setTimeout(() => router.refresh(), 3000);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/video-transcript/${deleteId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setTranscripts((prev) => prev.filter((t) => t.id !== deleteId));
        setDetailCache((prev) => {
          const next = { ...prev };
          delete next[deleteId];
          return next;
        });
        if (expandedId === deleteId) setExpandedId(null);
        addToast("Transcript deleted", "success");
      } else {
        addToast("Failed to delete transcript", "destructive");
      }
    } catch {
      addToast("An error occurred while deleting", "destructive");
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  function getStatusConfig(status: string) {
    switch (status) {
      case "completed":
        return {
          icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
          label: "Completed",
          badge: "bg-emerald-50 text-emerald-600 border-emerald-200",
        };
      case "processing":
        return {
          icon: <Loader className="h-4 w-4 text-blue-500 animate-spin" />,
          label: "Processing",
          badge: "bg-blue-50 text-blue-600 border-blue-200",
        };
      case "error":
        return {
          icon: <AlertCircle className="h-4 w-4 text-red-500" />,
          label: "Error",
          badge: "bg-red-50 text-red-600 border-red-200",
        };
      default:
        return {
          icon: <Clock className="h-4 w-4 text-gray-400" />,
          label: "Pending",
          badge: "bg-gray-50 text-gray-600 border-gray-200",
        };
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Video Transcript</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Upload videos and transcribe them with AI
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="h-8 w-8 p-0"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Upload Section */}
      <Card className="border-border/50 shadow-sm">
        <CardContent className="pt-6">
          <VideoUploader onUploadComplete={handleUploadComplete} />
        </CardContent>
      </Card>

      {/* Transcripts List */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Your Transcripts</CardTitle>
            <Badge variant="outline" className="text-xs font-medium">
              {transcripts.length} video{transcripts.length !== 1 ? "s" : ""}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {transcripts.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <FileVideo className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <p className="text-lg font-medium text-foreground">
                No transcripts yet
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Upload a video above to get started
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {transcripts.map((t) => {
                const isExpanded = expandedId === t.id;
                const detail = isExpanded ? detailCache[t.id] : null;
                const isLoading = loadingDetail === t.id && !detailCache[t.id];
                const statusConfig = getStatusConfig(t.status);

                return (
                  <div
                    key={t.id}
                    className={`rounded-lg border transition-all duration-200 ${
                      isExpanded
                        ? "border-primary/30 bg-muted/20 shadow-sm"
                        : "border-border/50 hover:border-border hover:bg-muted/10"
                    }`}
                  >
                    <div className="flex items-center gap-4 p-4">
                      {/* File icon */}
                      <div className="shrink-0 w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center">
                        <FileVideo className="h-5 w-5 text-primary/60" />
                      </div>

                      {/* Main content */}
                      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => {
                        if (t.status === "completed") handleToggleExpand(t.id);
                      }}>
                        {/* File name and status */}
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="font-medium text-sm truncate">
                            {t.filename}
                          </span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${statusConfig.badge}`}>
                            {statusConfig.icon}
                            {statusConfig.label}
                          </span>
                        </div>

                        {/* Metadata */}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{formatFileSize(t.fileSize)}</span>
                          {t.duration && (
                            <>
                              <span className="text-muted-foreground/50">·</span>
                              <span className="inline-flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {Math.floor(t.duration / 60)}:{String(Math.floor(t.duration % 60)).padStart(2, "0")}
                              </span>
                            </>
                          )}
                          <span className="text-muted-foreground/50">·</span>
                          <span>{new Date(t.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}</span>
                        </div>

                        {/* Error message */}
                        {t.status === "error" && t.error && (
                          <p className="mt-2 text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {t.error}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        {/* Transcribe button (pending) */}
                        {t.status === "pending" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTranscribe(t.id);
                            }}
                            disabled={transcribingId === t.id}
                            className="h-8 px-3 text-xs gap-1.5"
                          >
                            {transcribingId === t.id ? (
                              <Loader className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Play className="h-3.5 w-3.5" />
                            )}
                            {transcribingId === t.id ? "Starting..." : "Transcribe"}
                          </Button>
                        )}

                        {/* Retry button (error) */}
                        {t.status === "error" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTranscribe(t.id);
                            }}
                            disabled={transcribingId === t.id}
                            className="h-8 px-3 text-xs gap-1.5 text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700"
                          >
                            {transcribingId === t.id ? (
                              <Loader className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <AlertCircle className="h-3.5 w-3.5" />
                            )}
                            {transcribingId === t.id ? "Retrying..." : "Retry"}
                          </Button>
                        )}

                        {/* Processing indicator */}
                        {t.status === "processing" && (
                          <span className="inline-flex items-center gap-1.5 text-xs text-blue-600">
                            <Loader className="h-3.5 w-3.5 animate-spin" />
                            Processing...
                          </span>
                        )}

                        {/* View transcript button */}
                        {t.status === "completed" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleExpand(t.id);
                            }}
                            className="h-8 w-8 p-0"
                          >
                            {isExpanded ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        )}

                        {/* Re-transcribe button (completed) */}
                        {t.status === "completed" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTranscribe(t.id);
                            }}
                            disabled={transcribingId === t.id}
                            className="h-8 px-2 text-xs text-muted-foreground hover:text-primary"
                            title="Re-transcribe"
                          >
                            {transcribingId === t.id ? (
                              <Loader className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <RefreshCw className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        )}

                        {/* Audio link */}
                        {t.audioUrl && (
                          <a
                            href={t.audioUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                            title="Download audio"
                          >
                            <Headphones className="h-4 w-4" />
                          </a>
                        )}

                        {/* Video link */}
                        {t.videoUrl && (
                          <a
                            href={t.videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                            title="Download video"
                          >
                            <Play className="h-4 w-4" />
                          </a>
                        )}

                        {/* Delete button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteId(t.id);
                          }}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Expanded transcript viewer */}
                    {isExpanded && (
                      <div className="border-t border-border/50">
                        <div className="p-4">
                          {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                              <span className="ml-2 text-sm text-muted-foreground">
                                Loading transcript...
                              </span>
                            </div>
                          ) : detail?.transcript ? (
                            <TranscriptViewer
                              segments={(detail.transcript as Array<Record<string, unknown>>).map((s) => ({
                                start: (s.start ?? 0) as number,
                                end: (s.end ?? 0) as number,
                                text: (s.text ?? "") as string,
                              }))}
                              duration={detail.duration ?? undefined}
                              filename={detail.filename}
                            />
                          ) : (
                            <div className="py-8 text-center">
                              <p className="text-sm text-muted-foreground">
                                No transcript data available
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
        title="Delete Transcript"
        description={`Are you sure you want to delete this transcript? This will also remove the video and audio files from storage. This action cannot be undone.`}
        confirmLabel={deleting ? "Deleting..." : "Delete"}
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
