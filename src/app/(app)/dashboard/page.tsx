import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchPromptsList } from "@/lib/prompts";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, display_name")
    .eq("id", user!.id)
    .maybeSingle();

  const { data: prompts, error } = await fetchPromptsList(supabase);

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-neutral-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Привет, {profile?.display_name || user!.email}</h1>
            <p className="text-sm text-neutral-600">Твои промпты. Создай новый или открой существующий, чтобы запустить.</p>
          </div>
          <Link
            href="/prompts/new"
            className="rounded bg-black px-4 py-2 text-sm font-medium text-white"
          >
            + Новый промпт
          </Link>
        </div>
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold">Промпты</h2>
        {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error.message}</p>}
        {!error && (prompts?.length ?? 0) === 0 && (
          <div className="rounded border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-600">
            Пока ничего нет. <Link href="/prompts/new" className="underline">Создай первый промпт</Link>.
          </div>
        )}
        {!error && (prompts?.length ?? 0) > 0 && (
          <ul className="divide-y divide-neutral-200">
            {prompts!.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <Link href={`/prompts/${p.id}`} className="block truncate font-medium text-neutral-900 hover:underline">
                    {p.title}
                  </Link>
                  <div className="mt-0.5 flex flex-wrap gap-1 text-xs text-neutral-600">
                    <span className="rounded bg-neutral-100 px-1.5 py-0.5">{p.model}</span>
                    {(p.tags ?? []).map((t: string) => (
                      <span key={t} className="rounded bg-neutral-100 px-1.5 py-0.5">#{t}</span>
                    ))}
                    <span className="text-neutral-500">
                      обновлён {new Date(p.updated_at).toLocaleString("ru-RU")}
                    </span>
                  </div>
                </div>
                <Link
                  href={`/prompts/${p.id}`}
                  className="shrink-0 rounded border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50"
                >
                  Открыть →
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
