"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function DeletePromptButton({ id }: { id: string }) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [pending, start] = useTransition();

  const del = () => {
    if (!confirm("Удалить промпт? Действие необратимо.")) return;
    start(async () => {
      const { error } = await supabase.from("prompts").delete().eq("id", id);
      if (error) {
        alert(error.message);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    });
  };

  return (
    <button
      type="button"
      onClick={del}
      disabled={pending}
      className="rounded border border-rose-300 px-3 py-1.5 text-sm text-rose-700 hover:bg-rose-50 disabled:opacity-60"
    >
      {pending ? "Удаляем…" : "Удалить"}
    </button>
  );
}
