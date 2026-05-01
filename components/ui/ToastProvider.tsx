"use client";

import * as React from "react";
import { Toast } from "@/components/ui/Toast";

export interface ToastItem {
  id: string;
  message: string;
  variant?: "default" | "destructive" | "success";
}

interface ToastContextValue {
  addToast: (message: string, variant?: ToastItem["variant"]) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const addToast = React.useCallback(
    (message: string, variant: ToastItem["variant"] = "default") => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, message, variant }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {toasts.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
          {toasts.map((toast) => (
            <Toast
              key={toast.id}
              variant={toast.variant}
              onClose={() => removeToast(toast.id)}
            >
              {toast.message}
            </Toast>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}
