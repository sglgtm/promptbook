import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchPrompt } from "@/lib/prompts";
import { PromptForm } from "@/components/ui/PromptForm";

export const dynamic = "force-dynamic";

export default async function EditPromptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: prompt, error } = await fetchPrompt(supabase, id);
  if (error || !prompt) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Редактировать</h1>
        <Link href={`/prompts/${prompt.id}`} className="text-sm text-neutral-600 hover:underline">← К промпту</Link>
      </div>
      <div className="rounded-lg border border-neutral-200 bg-white p-4">
        <PromptForm
          mode="edit"
          initial={{
            id: prompt.id,
            title: prompt.title,
            body: prompt.body,
            tags: prompt.tags,
            model: prompt.model,
          }}
        />
      </div>
    </div>
  );
}
