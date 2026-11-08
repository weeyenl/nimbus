"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastVariant = "success" | "error" | "warning" | "info";

interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
}

export function showToast(message: string, variant: ToastVariant = "info") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("nimbus-toast", {
      detail: { id: `${Date.now()}-${Math.random()}`, message, variant },
    })
  );
}

export function ToastViewport() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<ToastItem>).detail;
      if (!detail) return;
      setToasts((prev) => [...prev.slice(-3), detail]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== detail.id));
      }, 4200);
    };
    window.addEventListener("nimbus-toast", handler);
    return () => window.removeEventListener("nimbus-toast", handler);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="no-print fixed bottom-20 right-4 z-[100] flex flex-col gap-2 max-w-sm w-[calc(100vw-2rem)] md:bottom-5 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "pointer-events-auto flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5 text-xs font-medium shadow-lg animate-in fade-in slide-in-from-bottom-2",
            t.variant === "success" && "bg-emerald-50 border-emerald-300 text-emerald-900",
            t.variant === "error" && "bg-red-50 border-red-300 text-red-900",
            t.variant === "warning" && "bg-amber-50 border-amber-300 text-amber-900",
            t.variant === "info" && "bg-card border-border text-foreground"
          )}
        >
          {t.variant === "success" && <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />}
          {t.variant === "error" && <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />}
          {t.variant === "warning" && <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />}
          {t.variant === "info" && <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />}
          <span className="flex-1 leading-snug">{t.message}</span>
          <button
            type="button"
            onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
            className="opacity-60 hover:opacity-100 shrink-0"
            aria-label="Close notification"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
