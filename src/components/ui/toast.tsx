"use client";

import { useEffect, useCallback, type ReactNode } from "react";
import { create } from "zustand";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";

/* ---------- Types ---------- */

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  description?: string;
  duration?: number;
}

type AddToastPayload = Omit<Toast, "id">;

/* ---------- Store ---------- */

interface ToastStore {
  toasts: Toast[];
  addToast: (toast: AddToastPayload) => string;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

let toastCounter = 0;

const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = `toast-${++toastCounter}-${Date.now()}`;
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));
    return id;
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
  clearAll: () => set({ toasts: [] }),
}));

/* ---------- Hook ---------- */

export function useToast() {
  const { addToast, removeToast, clearAll } = useToastStore();

  const toast = useCallback(
    (payload: AddToastPayload) => addToast(payload),
    [addToast]
  );

  const success = useCallback(
    (message: string, opts?: Partial<AddToastPayload>) =>
      addToast({ type: "success", message, ...opts }),
    [addToast]
  );

  const error = useCallback(
    (message: string, opts?: Partial<AddToastPayload>) =>
      addToast({ type: "error", message, ...opts }),
    [addToast]
  );

  const info = useCallback(
    (message: string, opts?: Partial<AddToastPayload>) =>
      addToast({ type: "info", message, ...opts }),
    [addToast]
  );

  const warning = useCallback(
    (message: string, opts?: Partial<AddToastPayload>) =>
      addToast({ type: "warning", message, ...opts }),
    [addToast]
  );

  return { toast, success, error, info, warning, removeToast, clearAll };
}

/* ---------- Icons & Styles ---------- */

const iconMap: Record<ToastType, string> = {
  success: "check_circle",
  error: "error",
  info: "info",
  warning: "warning",
};

const typeStyles: Record<ToastType, string> = {
  success: "bg-success-container text-on-surface border-success/30",
  error: "bg-error-container text-on-error-container border-error/30",
  info: "bg-secondary-container text-on-secondary-container border-secondary/30",
  warning: "bg-warning-container text-on-surface border-warning/30",
};

const iconColors: Record<ToastType, string> = {
  success: "text-success",
  error: "text-error",
  info: "text-secondary",
  warning: "text-warning",
};

/* ---------- Toast Item ---------- */

function ToastItem({ toast }: { toast: Toast }) {
  const { removeToast } = useToastStore();
  const duration = toast.duration ?? 4000;

  useEffect(() => {
    if (duration <= 0) return;
    const timer = setTimeout(() => removeToast(toast.id), duration);
    return () => clearTimeout(timer);
  }, [toast.id, duration, removeToast]);

  return (
    <div
      role="alert"
      className={cn(
        "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border p-4",
        "shadow-lg animate-in slide-in-from-bottom-4 fade-in-0 duration-300",
        typeStyles[toast.type]
      )}
    >
      <Icon
        name={iconMap[toast.type]}
        size={20}
        filled
        className={cn("shrink-0 mt-0.5 mr-0.5", iconColors[toast.type])}
      />
      <div className="flex-1 min-w-0">
        <p className="text-label-lg font-semibold">{toast.message}</p>
        {toast.description && (
          <p className="mt-1 text-body-md opacity-80">{toast.description}</p>
        )}
      </div>
      <button
        onClick={() => removeToast(toast.id)}
        className="shrink-0 rounded-full p-1 transition-colors hover:bg-black/10 dark:hover:bg-white/10"
        aria-label="Dismiss"
      >
        <Icon name="close" size={16} />
      </button>
    </div>
  );
}

/* ---------- Toaster ---------- */

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-label="Notifications"
      className={cn(
        "fixed inset-x-0 bottom-0 z-[100] flex flex-col-reverse items-center gap-2",
        "px-4 pb-safe pointer-events-none",
        "pb-20 sm:pb-6"
      )}
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
}
