"use client";

import { useState, useMemo } from "react";
import { Search, Copy, Download, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/ToastProvider";

export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}

interface TranscriptViewerProps {
  segments: TranscriptSegment[];
  /** Duration of the video in seconds */
  duration?: number;
  filename?: string;
}

/** Format seconds to hh:mm:ss or mm:ss */
function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) {
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function TranscriptViewer({
  segments,
  duration,
  filename,
}: TranscriptViewerProps) {
  const { addToast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredSegments = useMemo(() => {
    if (!searchQuery.trim()) return segments;
    const q = searchQuery.toLowerCase();
    return segments.filter((s) => s.text.toLowerCase().includes(q));
  }, [segments, searchQuery]);

  const fullText = useMemo(
    () => segments.map((s) => s.text).join(""),
    [segments]
  );

  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(fullText);
      setCopiedId("all");
      addToast("Copied to clipboard", "success");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      addToast("Failed to copy", "destructive");
    }
  };

  const handleDownloadTxt = () => {
    const header =
      filename
        ? `Transcript: ${filename}\n${duration ? `Duration: ${formatTime(duration)}\n` : ""}${"=".repeat(40)}\n\n`
        : "";

    const content = segments
      .map((s) => `[${formatTime(s.start)} - ${formatTime(s.end)}] ${s.text}`)
      .join("\n");

    const blob = new Blob([header + content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(filename || "transcript").replace(/\.[^.]+$/, "")}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    addToast("Transcript downloaded", "success");
  };

  const matchCount = filteredSegments.length;
  const totalCount = segments.length;

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search transcript..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>

        <Button variant="outline" size="sm" onClick={handleCopyAll} className="gap-1.5">
          {copiedId === "all" ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          {copiedId === "all" ? "Copied" : "Copy All"}
        </Button>

        <Button variant="outline" size="sm" onClick={handleDownloadTxt} className="gap-1.5">
          <Download className="h-4 w-4" />
          Download TXT
        </Button>
      </div>

      {/* Info bar */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{totalCount} segments</span>
        {duration && <span>Duration: {formatTime(duration)}</span>}
        {searchQuery && (
          <span>
            Found {matchCount} / {totalCount} matches
          </span>
        )}
      </div>

      {/* Transcript content */}
      <div className="max-h-[500px] overflow-y-auto rounded-lg border bg-card">
        {filteredSegments.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            {searchQuery ? "No matches found" : "No transcript content"}
          </div>
        ) : (
          <div className="divide-y">
            {filteredSegments.map((seg, i) => (
              <div
                key={i}
                className="flex gap-3 px-4 py-2.5 transition-colors hover:bg-muted/30"
              >
                <span className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums leading-6 min-w-[4.5rem]">
                  {formatTime(seg.start)}
                </span>
                <p className="text-sm leading-6 text-foreground">
                  {seg.text}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
