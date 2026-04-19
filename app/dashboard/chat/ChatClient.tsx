"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useRef, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ChatSidebar from "@/components/ChatSidebar";
import { createChatSession, updateChatSessionTitle } from "@/app/actions/chat-actions";

interface Session {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Message {
  id: string;
  role: string;
  content: string;
  createdAt: Date;
}

interface ChatClientProps {
  sessions: Session[];
  messages: Message[];
  currentSessionId: string | null;
}

export default function ChatClient({
  sessions: serverSessions,
  messages: serverMessages,
  currentSessionId: serverSessionId,
}: ChatClientProps) {
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [sessions, setSessions] = useState<Session[]>(serverSessions);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(serverSessionId);
  const [isEditingTitle, setIsEditingTitle] = useState<string | null>(null);
  const [editingTitleValue, setEditingTitleValue] = useState("");

  // Memoize initialMessages to prevent useChat from re-initializing
  const initialMessages = useMemo(() => serverMessages.map((m) => ({
    id: m.id,
    role: m.role as "user" | "assistant",
    content: m.content,
  })), [serverMessages]);

  const { messages: chatMessages, input, handleInputChange, handleSubmit, isLoading, error } =
    useChat({
      api: "/api/chat",
      body: {
        sessionId: currentSessionId,
      },
      initialMessages,
      onFinish: () => {
        // Refresh to sync with server data
        router.refresh();
      },
    });

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Sync sessions when server data changes
  useEffect(() => {
    setSessions(serverSessions);
    if (serverSessionId !== currentSessionId) {
      setCurrentSessionId(serverSessionId);
    }
  }, [serverSessions, serverSessionId]);

  const handleNewChat = async () => {
    const newSession = await createChatSession();
    setSessions([newSession, ...sessions]);
    setCurrentSessionId(newSession.id);
    router.push(`/dashboard/chat/${newSession.id}`);
  };

  const handleStartEditTitle = (sessionId: string, currentTitle: string) => {
    setIsEditingTitle(sessionId);
    setEditingTitleValue(currentTitle);
  };

  const handleSaveTitle = async (sessionId: string) => {
    if (editingTitleValue.trim() && editingTitleValue !== sessions.find(s => s.id === sessionId)?.title) {
      try {
        await updateChatSessionTitle(sessionId, editingTitleValue.trim());
        setSessions(sessions.map(s => 
          s.id === sessionId ? { ...s, title: editingTitleValue.trim() } : s
        ));
      } catch (e) {
        console.error("Failed to update title", e);
      }
    }
    setIsEditingTitle(null);
    setEditingTitleValue("");
  };

  const handleCancelEdit = () => {
    setIsEditingTitle(null);
    setEditingTitleValue("");
  };

  // Custom submit to handle no session case
  const handleCustomSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    // If no current session, create one first
    if (!currentSessionId) {
      const newSession = await createChatSession();
      setSessions([newSession, ...sessions]);
      setCurrentSessionId(newSession.id);
      // Navigate to the new session
      router.push(`/dashboard/chat/${newSession.id}`);
      // Small delay to ensure navigation before submit
      setTimeout(() => {
        handleSubmit(e);
      }, 100);
    } else {
      handleSubmit(e);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <ChatSidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        onNewChat={handleNewChat}
        onEditTitle={handleStartEditTitle}
        isEditingTitle={isEditingTitle}
        editingTitleValue={editingTitleValue}
        onEditingTitleChange={setEditingTitleValue}
        onSaveTitle={handleSaveTitle}
        onCancelEdit={handleCancelEdit}
      />

      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          {chatMessages.length === 0 ? (
            <div className="flex h-full items-center justify-center text-gray-500">
              <div className="text-center">
                <p className="text-lg">Start a conversation</p>
                <p className="mt-1 text-sm">
                  Ask questions about your uploaded documents
                </p>
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-4">
              {chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      message.role === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="rounded-lg bg-gray-100 px-4 py-2 text-gray-500">
                    Thinking...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-gray-200 bg-white p-4">
          <form
            onSubmit={handleCustomSubmit}
            className="mx-auto flex max-w-3xl gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder="Ask a question about your documents..."
              disabled={isLoading}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Send
            </button>
          </form>
          {error && (
            <div className="mx-auto mt-2 max-w-3xl text-sm text-red-600">
              Error: {error.message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}