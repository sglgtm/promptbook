"use client";

import { useState } from "react";

// Реальный navigator.clipboard с fallback на textarea+execCommand для старых браузеров/http.
export function CopyButton({ text, label = "Скопировать" }: { text: string; label?: string }) {
  const [state, setState] = useState<"idle" | "ok" | "err">("idle");

  const doCopy = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(ta);
        if (!ok) throw new Error("execCommand failed");
      }
      setState("ok");
      setTimeout(() => setState("idle"), 1500);
    } catch {
      setState("err");
      setTimeout(() => setState("idle"), 2500);
    }
  };

  return (
    <button
      type="button"
      onClick={doCopy}
      className="rounded border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50"
      aria-live="polite"
    >
      {state === "ok" ? "Скопировано" : state === "err" ? "Не удалось" : label}
    </button>
  );
}
