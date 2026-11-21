"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  // Blocks a second confirm while a previous confirm promise is still pending.
  const pendingRef = useRef(false);

  async function handleConfirm(): Promise<void> {
    if (pendingRef.current || loading) {
      return;
    }

    pendingRef.current = true;
    try {
      await onConfirm();
    } finally {
      pendingRef.current = false;
    }
  }

  function handleClose(): void {
    if (!loading) {
      onCancel();
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={title}
      description={message}
      footer={
        <>
          <Button variant="outline" onClick={onCancel} disabled={loading} fullWidth>
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? "danger" : "primary"}
            onClick={() => {
              void handleConfirm();
            }}
            loading={loading}
            loadingText="Please wait..."
            fullWidth
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <></>
    </Modal>
  );
}
