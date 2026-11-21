"use client";

import { useContext } from "react";
import { ToastContext, type ToastContextValue } from "@/components/ui/Toast";

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
