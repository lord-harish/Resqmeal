"use client";

import { Modal, type ModalProps } from "@/components/ui/Modal";

export function Dialog({ open, onClose, title, description, children }: Omit<ModalProps, "footer">) {
  return (
    <Modal open={open} onClose={onClose} title={title} description={description}>
      {children}
    </Modal>
  );
}
