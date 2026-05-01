"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

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
        router.refresh();
        onDeleted?.();
      } else {
        alert("Failed to delete document");
      }
    } catch {
      alert("An error occurred while deleting");
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
