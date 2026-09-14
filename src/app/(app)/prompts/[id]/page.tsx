import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchPrompt } from "@/lib/prompts";
import { PromptRunner } from "@/components/ui/PromptRunner";
import { DeletePromptButton } from "@/components/ui/DeletePromptButton";

export const dynamic = "force-dynamic";

export default async function PromptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: prompt, error } = await fetchPrompt(supabase, id);
  if (error || !prompt) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <Link href="/dashboard" className="text-sm text-neutral-600 hover:underline">← К списку</Link>
        <div className="flex gap-2">
          <Link
            href={`/prompts/${prompt.id}/edit`}
            className="rounded border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50"
          >
            Редактировать
          </Link>
          <DeletePromptButton id={prompt.id} />
        </div>
      </div>

      <section className="rounded-lg border border-neutral-200 bg-white p-4">
        <h1 className="text-xl font-bold">{prompt.title}</h1>
        <div className="mt-1 flex flex-wrap gap-1 text-xs text-neutral-600">
          <span className="rounded bg-neutral-100 px-1.5 py-0.5">{prompt.model}</span>
          {(prompt.tags ?? []).map((t: string) => (
            <span key={t} className="rounded bg-neutral-100 px-1.5 py-0.5">#{t}</span>
          ))}
          <span className="text-neutral-500">
            обновлён {new Date(prompt.updated_at).toLocaleString("ru-RU")}
          </span>
        </div>
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="mb-2 text-sm font-semibold">Запуск</h2>
        <PromptRunner promptId={prompt.id} body={prompt.body} model={prompt.model} />
      </section>
    </div>
  );
}
