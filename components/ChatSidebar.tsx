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
}

export default function ChatSidebar({
  sessions,
  currentSessionId,
  onNewChat,
}: ChatSidebarProps) {
  const router = useRouter();

  const handleDelete = async (sessionId: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (!confirm("Delete this chat session?")) return;
    await deleteChatSession(sessionId);
    router.refresh();
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
                  <p className="truncate">{session.title}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    {new Date(session.updatedAt).toLocaleDateString()}
                  </p>
                </Link>
                <button
                  onClick={(e) => handleDelete(session.id, e)}
                  className="absolute right-2 top-3 hidden rounded p-1 text-red-500 hover:bg-red-50 group-hover:block"
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
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
