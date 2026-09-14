"use client";

import { useMemo, useState, useTransition } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { assemble, extractVariables } from "@/lib/prompts";
import { CopyButton } from "@/components/ui/CopyButton";

// Собирает промпт из тела и переменных, копирует и логирует запуск в prompt_runs.
// LLM-вызов в MVP не делаем — пользователь вставляет в внешнюю LLM и возвращается с оценкой.
export function PromptRunner({
  promptId,
  body,
  model,
}: {
  promptId: string;
  body: string;
  model: "sonar" | "sonar-pro";
}) {
  const supabase = createSupabaseBrowserClient();
  const vars = useMemo(() => extractVariables(body), [body]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [lastRunId, setLastRunId] = useState<string | null>(null);
  const [rating, setRating] = useState<"up" | "down" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const assembled = assemble(body, values);

  const logRun = () =>
    start(async () => {
      setError(null);
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setError("Сессия истекла, перезайди");
        return;
      }
      const { data, error } = await supabase
        .from("prompt_runs")
        .insert({
          prompt_id: promptId,
          user_id: userData.user.id,
          variable_values: values,
          assembled_prompt: assembled,
          model,
          status: "ok",
        })
        .select("id")
        .single();
      if (error) return setError(error.message);
      setLastRunId(data.id);
      setRating(null);
    });

  const rate = (value: "up" | "down") =>
    start(async () => {
      if (!lastRunId) return;
      const { error } = await supabase.from("prompt_runs").update({ rating: value }).eq("id", lastRunId);
      if (error) return setError(error.message);
      setRating(value);
    });

  return (
    <div className="space-y-4">
      {vars.length > 0 && (
        <div className="space-y-2 rounded border border-neutral-200 p-3">
          <p className="text-sm font-medium">Заполни переменные</p>
          {vars.map((v) => (
            <label key={v} className="block text-sm">
              <span className="mb-1 block text-xs text-neutral-600">{v}</span>
              <input
                className="w-full rounded border border-neutral-300 px-3 py-2"
                value={values[v] ?? ""}
                onChange={(e) => setValues((s) => ({ ...s, [v]: e.target.value }))}
              />
            </label>
          ))}
        </div>
      )}

      <div>
        <p className="mb-1 text-sm font-medium">Собранный промпт</p>
        <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded border border-neutral-200 bg-neutral-50 p-3 text-sm">
{assembled}
        </pre>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <CopyButton text={assembled} label="Скопировать и залогировать" />
        <button
          type="button"
          onClick={logRun}
          disabled={pending}
          className="rounded bg-black px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
        >
          {pending ? "…" : "Только залогировать запуск"}
        </button>
      </div>

      {lastRunId && (
        <div className="flex items-center gap-2 rounded bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          <span>Запуск сохранён.</span>
          <button
            type="button"
            onClick={() => rate("up")}
            className={`rounded border px-2 py-0.5 text-xs ${
              rating === "up" ? "border-emerald-600 bg-emerald-100" : "border-neutral-300"
            }`}
          >
            👍 сработало
          </button>
          <button
            type="button"
            onClick={() => rate("down")}
            className={`rounded border px-2 py-0.5 text-xs ${
              rating === "down" ? "border-rose-600 bg-rose-100" : "border-neutral-300"
            }`}
          >
            👎 не то
          </button>
        </div>
      )}

      {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}
