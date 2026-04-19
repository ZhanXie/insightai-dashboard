"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteChatSession } from "@/app/actions/chat-actions";

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

  const handleDelete = async (sessionId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Delete this chat session?")) return;
    await deleteChatSession(sessionId);
    router.refresh();
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
    <div className="w-64 border-r border-gray-200 bg-white">
      <div className="flex h-12 items-center justify-between border-b border-gray-200 px-3">
        <span className="font-medium">Chat History</span>
        <button
          onClick={onNewChat}
          className="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700"
        >
          + New
        </button>
      </div>
      <div className="overflow-y-auto">
        {sessions.length === 0 ? (
          <div className="p-4 text-sm text-gray-500">No chat sessions yet</div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {sessions.map((session) => (
              <li key={session.id} className="group relative">
                <Link
                  href={`/dashboard/chat/${session.id}`}
                  className={`block px-4 py-3 text-sm hover:bg-gray-50 ${
                    session.id === currentSessionId
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700"
                  }`}
                >
                  {isEditingTitle === session.id ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={editingTitleValue}
                        onChange={(e) => onEditingTitleChange?.(e.target.value)}
                        onKeyDown={(e) => handleKeyDown(session.id, e)}
                        className="flex-1 rounded border border-blue-300 px-1 py-0.5 text-sm focus:border-blue-500 focus:outline-none"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          onSaveTitle?.(session.id);
                        }}
                        className="rounded bg-blue-600 px-1 py-0.5 text-xs text-white hover:bg-blue-700"
                      >
                        ✓
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          onCancelEdit?.();
                        }}
                        className="rounded bg-gray-300 px-1 py-0.5 text-xs text-gray-700 hover:bg-gray-400"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className="truncate pr-8">{session.title}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {new Date(session.updatedAt).toLocaleDateString()}
                      </p>
                    </>
                  )}
                </Link>
                
                {/* Edit and Delete buttons */}
                {isEditingTitle !== session.id && (
                  <div className="absolute right-2 top-3 flex gap-1">
                    <button
                      onClick={(e) => handleEditClick(session.id, session.title, e)}
                      className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Edit title"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => handleDelete(session.id, e)}
                      className="rounded p-1 text-red-400 hover:bg-red-50 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}