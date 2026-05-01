"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useRef, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ChatSidebar from "@/components/ChatSidebar";
import { createChatSession, updateChatSessionTitle } from "@/app/actions/chat-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(
    serverSessionId
  );
  const [isEditingTitle, setIsEditingTitle] = useState<string | null>(null);
  const [editingTitleValue, setEditingTitleValue] = useState("");

  const initialMessages = useMemo(
    () =>
      serverMessages.map((m) => ({
        id: m.id,
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    [serverMessages]
  );

  const {
    messages: chatMessages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
  } = useChat({
    api: "/api/chat",
    body: {
      sessionId: currentSessionId,
    },
    initialMessages,
    onFinish: () => {
      router.refresh();
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

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

  const handleStartEditTitle = (
    sessionId: string,
    currentTitle: string
  ) => {
    setIsEditingTitle(sessionId);
    setEditingTitleValue(currentTitle);
  };

  const handleSaveTitle = async (sessionId: string) => {
    if (
      editingTitleValue.trim() &&
      editingTitleValue !==
        sessions.find((s) => s.id === sessionId)?.title
    ) {
      try {
        await updateChatSessionTitle(sessionId, editingTitleValue.trim());
        setSessions(
          sessions.map((s) =>
            s.id === sessionId
              ? { ...s, title: editingTitleValue.trim() }
              : s
          )
        );
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

  const handleCustomSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!input.trim()) return;

    if (!currentSessionId) {
      const newSession = await createChatSession();
      setSessions([newSession, ...sessions]);
      setCurrentSessionId(newSession.id);
      router.push(`/dashboard/chat/${newSession.id}`);
      setTimeout(() => {
        handleSubmit(e);
      }, 100);
    } else {
      handleSubmit(e);
    }
  };

  return (
    <div className="flex h-full">
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

      <div className="flex flex-1 flex-col">
        <div className="flex-1 overflow-y-auto p-4">
          {chatMessages.length === 0 ? (
            <div className="flex h-full items-center justify-center text-muted-foreground">
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
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="rounded-lg bg-muted px-4 py-2 text-muted-foreground">
                    Thinking...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="border-t bg-background p-4">
          <form
            onSubmit={handleCustomSubmit}
            className="mx-auto flex max-w-3xl gap-2"
          >
            <Input
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder="Ask a question about your documents..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading || !input.trim()}>
              Send
            </Button>
          </form>
          {error && (
            <div className="mx-auto mt-2 max-w-3xl text-sm text-destructive">
              Error: {error.message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
