"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { parseTags, extractVariables } from "@/lib/prompts";

type Mode = "create" | "edit";
type Initial = {
  id?: string;
  title?: string;
  body?: string;
  tags?: string[];
  model?: "sonar" | "sonar-pro";
};

export function PromptForm({ mode, initial }: { mode: Mode; initial?: Initial }) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [tags, setTags] = useState((initial?.tags ?? []).join(", "));
  const [model, setModel] = useState<"sonar" | "sonar-pro">(initial?.model ?? "sonar");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const detectedVars = extractVariables(body);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim() || !body.trim()) {
      setError("Заполни название и тело промпта");
      return;
    }
    start(async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setError("Сессия истекла, перезайди");
        return;
      }
      const row = {
        user_id: userData.user.id,
        title: title.trim(),
        body,
        tags: parseTags(tags),
        model,
        variables: detectedVars,
      };
      if (mode === "create") {
        const { data, error } = await supabase.from("prompts").insert(row).select("id").single();
        if (error) return setError(error.message);
        router.push(`/prompts/${data.id}`);
        router.refresh();
      } else if (initial?.id) {
        const { error } = await supabase.from("prompts").update(row).eq("id", initial.id);
        if (error) return setError(error.message);
        router.push(`/prompts/${initial.id}`);
        router.refresh();
      }
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Название</label>
        <input
          className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          placeholder="Например: Разбор конкурентов для SEO-статьи"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">
          Тело промпта{" "}
          <span className="text-xs text-neutral-500">
            (переменные в двойных фигурных скобках: <code>{"{{topic}}"}</code>)
          </span>
        </label>
        <textarea
          className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 font-mono text-sm"
          rows={12}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={20000}
          placeholder="Опиши задачу для LLM. Используй {{переменные}}, которые заполнишь при запуске."
        />
        {detectedVars.length > 0 && (
          <div className="mt-1 text-xs text-neutral-600">
            Найдены переменные: {detectedVars.map((v) => (
              <code key={v} className="mr-1 rounded bg-neutral-100 px-1">
                {v}
              </code>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium">Теги (через запятую)</label>
          <input
            className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="seo, конкуренты, ru"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Модель</label>
          <select
            className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
            value={model}
            onChange={(e) => setModel(e.target.value as "sonar" | "sonar-pro")}
          >
            <option value="sonar">sonar</option>
            <option value="sonar-pro">sonar-pro</option>
          </select>
        </div>
      </div>

      {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {pending ? "Сохраняем…" : mode === "create" ? "Создать" : "Сохранить"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded border border-neutral-300 px-4 py-2 text-sm"
        >
          Отмена
        </button>
      </div>
    </form>
  );
}
