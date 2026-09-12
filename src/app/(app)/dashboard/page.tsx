import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Проверим, что profiles-триггер отработал.
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, display_name, created_at")
    .eq("id", user!.id)
    .maybeSingle();

  // Пустой запрос по prompts просто чтобы удостовериться, что RLS + запрос работают.
  const { count: promptsCount } = await supabase
    .from("prompts")
    .select("*", { count: "exact", head: true });

  return (
    <div className="space-y-6">
      <section className="bg-white border border-line rounded-lg p-4">
        <h1 className="text-xl font-bold mb-1">Привет, {profile?.display_name || user!.email}</h1>
        <p className="text-sm text-ink-muted">
          Итерация 1: аккаунт создан, сессия работает, RLS-запросы проходят. Промпты появятся на Итерации 2.
        </p>
      </section>

      <section className="bg-white border border-line rounded-lg p-4">
        <h2 className="text-sm font-semibold mb-2">Проверки P0.1</h2>
        <ul className="text-sm space-y-1">
          <li>✓ Сессия Supabase: <span className="font-mono">{user!.email}</span></li>
          <li>
            {profile
              ? <>✓ Триггер <span className="font-mono">handle_new_user</span> создал профиль</>
              : <span className="text-red-600">✗ Профиль не создан. Ошибка: {profileError?.message || "не найдено"}</span>}
          </li>
          <li>✓ Запрос к <span className="font-mono">prompts</span> с RLS. Количество: {promptsCount ?? 0}</li>
        </ul>
      </section>
    </div>
  );
}
