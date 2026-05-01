"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteChatSession } from "@/app/actions/chat-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Pencil, X } from "lucide-react";

interface Session {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ChatSidebarProps {
  sessions: Session[];
  currentSessionId: string | null;
  onNewChat: () => void;
  onEditTitle?: (sessionId: string, currentTitle: string) => void;
  isEditingTitle?: string | null;
  editingTitleValue?: string;
  onEditingTitleChange?: (value: string) => void;
  onSaveTitle?: (sessionId: string) => void;
  onCancelEdit?: () => void;
}

export default function ChatSidebar({
  sessions,
  currentSessionId,
  onNewChat,
  onEditTitle,
  isEditingTitle,
  editingTitleValue,
  onEditingTitleChange,
  onSaveTitle,
  onCancelEdit,
}: ChatSidebarProps) {
  const router = useRouter();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);

  const handleDelete = async (sessionId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSessionToDelete(sessionId);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!sessionToDelete) return;

    await deleteChatSession(sessionToDelete);
    if (sessionToDelete === currentSessionId) {
      router.push("/dashboard/chat");
    } else {
      router.refresh();
    }
    setSessionToDelete(null);
    setDeleteConfirmOpen(false);
  };

  const handleEditClick = (sessionId: string, title: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onEditTitle?.(sessionId, title);
  };

  const handleKeyDown = (sessionId: string, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSaveTitle?.(sessionId);
    } else if (e.key === "Escape") {
      onCancelEdit?.();
    }
  };

  return (
    <div className="w-64 border-r bg-background flex flex-col">
      <div className="flex items-center justify-between p-3">
        <span className="font-medium text-sm">Chat History</span>
        <Button onClick={onNewChat} size="sm">
          + New
        </Button>
      </div>
      <Separator />
      <div className="flex-1 overflow-y-auto">
        {sessions.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">
            No chat sessions yet
          </div>
        ) : (
          <ul className="divide-y">
            {sessions.map((session) => (
              <li key={session.id} className="group relative">
                <Link
                  href={`/dashboard/chat/${session.id}`}
                  className={`block px-4 py-3 text-sm hover:bg-muted/50 transition-colors ${
                    session.id === currentSessionId
                      ? "bg-muted text-foreground font-medium"
                      : "text-muted-foreground"
                  }`}
                >
                  {isEditingTitle === session.id ? (
                    <div className="flex items-center gap-1">
                      <Input
                        value={editingTitleValue}
                        onChange={(e) => onEditingTitleChange?.(e.target.value)}
                        onKeyDown={(e) => handleKeyDown(session.id, e)}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                        className="h-6 text-xs"
                      />
                      <Button
                        size="xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          onSaveTitle?.(session.id);
                        }}
                      >
                        ✓
                      </Button>
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          onCancelEdit?.();
                        }}
                      >
                        ✕
                      </Button>
                    </div>
                  ) : (
                    <>
                      <p className="truncate pr-8">{session.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(session.updatedAt).toLocaleDateString()}
                      </p>
                    </>
                  )}
                </Link>

                {isEditingTitle !== session.id && (
                  <div className="absolute right-2 top-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={(e) =>
                        handleEditClick(session.id, session.title, e)
                      }
                      title="Edit title"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={(e) => handleDelete(session.id, e)}
                      title="Delete"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Chat Session"
        description="Are you sure you want to delete this chat session? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={confirmDelete}
      />
    </div>
  );
}
