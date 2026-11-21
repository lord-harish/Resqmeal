"use client";

import { createContext, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export type ToastTone = "success" | "error" | "info";

export interface ToastItem {
  id: number;
  tone: ToastTone;
  message: string;
}

export interface ToastContextValue {
  showToast: (message: string, tone?: ToastTone) => void;
}

const TOAST_DURATION_MS = 4000;

export const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const toneClasses: Record<ToastTone, string> = {
  success: "border-l-[#16A34A]",
  error: "border-l-[#DC2626]",
  info: "border-l-[#12372A]",
};

function ToastItemView({ toast }: { toast: ToastItem }) {
  return (
    <div
      className={cn(
        "w-full max-w-sm rounded-xl border border-l-4 border-[#E2E8F0] bg-[#FFFFFF] px-4 py-3 text-sm text-[#334155] shadow-lg",
        toneClasses[toast.tone],
      )}
    >
      {toast.message}
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextIdRef = useRef(0);
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const dismissToast = useCallback((id: number) => {
    const timer = timersRef.current.get(id);
    if (timer !== undefined) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, tone: ToastTone = "info") => {
      nextIdRef.current += 1;
      const id = nextIdRef.current;
      setToasts((current) => [...current, { id, tone, message }]);

      const timer = setTimeout(() => {
        timersRef.current.delete(id);
        setToasts((current) => current.filter((toast) => toast.id !== id));
      }, TOAST_DURATION_MS);
      timersRef.current.set(id, timer);
    },
    [],
  );

  // Clear all pending timers when the provider unmounts.
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className={cn(
          "pointer-events-none fixed inset-x-4 bottom-20 z-[60] flex flex-col items-center gap-2",
          "sm:inset-x-auto sm:bottom-6 sm:right-6 sm:items-end",
        )}
      >
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto flex w-full justify-center sm:justify-end">
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="w-full max-w-sm text-left"
              aria-label="Dismiss notification"
            >
              <ToastItemView toast={toast} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
