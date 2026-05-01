"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-2 overflow-hidden rounded-lg border px-4 py-3 shadow-md transition-all",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground border-border",
        destructive:
          "bg-destructive/10 text-destructive border-destructive/30",
        success:
          "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface ToastProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof toastVariants> {
  onClose?: () => void;
}

export function Toast({
  className,
  variant,
  onClose,
  children,
  ...props
}: ToastProps) {
  return (
    <div
      className={cn(toastVariants({ variant }), className)}
      {...props}
    >
      <div className="flex-1 text-sm">{children}</div>
      {onClose && (
        <button
          onClick={onClose}
          className="shrink-0 rounded-md p-1 text-foreground/50 hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <XIcon className="size-4" />
          <span className="sr-only">Close</span>
        </button>
      )}
    </div>
  );
}
