"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/ToastProvider";

interface DeleteDocumentButtonProps {
  documentId: string;
  filename: string;
  onDeleted?: () => void;
}

export default function DeleteDocumentButton({
  documentId,
  filename,
  onDeleted,
}: DeleteDocumentButtonProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    setShowConfirm(false);
    try {
      const res = await fetch(`/api/documents/${documentId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        addToast("Document deleted successfully", "success");
        router.refresh();
        onDeleted?.();
      } else {
        addToast("Failed to delete document", "destructive");
      }
    } catch {
      addToast("An error occurred while deleting", "destructive");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Button
        variant="destructive"
        size="sm"
        onClick={() => setShowConfirm(true)}
        disabled={deleting}
      >
        {deleting ? "Deleting..." : "Delete"}
      </Button>
      <ConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title="Delete Document"
        description={`Are you sure you want to delete "${filename}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </>
  );
}
