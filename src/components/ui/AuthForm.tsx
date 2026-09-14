"use client";
import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import Link from "next/link";

type Mode = "signup" | "login";

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next: string = searchParams.get("next") || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    startTransition(async () => {
      const supabase = createSupabaseBrowserClient();
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: displayName || null } },
        });
        if (error) return setError(error.message);
        // При включённой e-mail подтверждении session=null; при отключённой — сразу session.
        if (!data.session) {
          setInfo("Мы отправили письмо для подтверждения. После подтверждения войди на /login.");
          return;
        }
        router.replace(next as never);
        router.refresh();
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return setError(error.message);
      router.replace(next as never);
      router.refresh();
    });
  };

  return (
    <form onSubmit={submit} className="max-w-sm w-full space-y-3">
      <h1 className="text-xl font-bold">{mode === "signup" ? "Регистрация" : "Вход"}</h1>

      {mode === "signup" && (
        <div>
          <label className="block text-xs text-ink-muted mb-1" htmlFor="displayName">Имя (опционально)</label>
          <input
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full border border-line rounded-md px-3 py-2 bg-white"
          />
        </div>
      )}

      <div>
        <label className="block text-xs text-ink-muted mb-1" htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-line rounded-md px-3 py-2 bg-white"
        />
      </div>
      <div>
        <label className="block text-xs text-ink-muted mb-1" htmlFor="password">Пароль (≥8 символов)</label>
        <input
          id="password"
          type="password"
          minLength={8}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-line rounded-md px-3 py-2 bg-white"
        />
      </div>

      {error && <div className="text-sm text-red-600 border border-red-200 bg-red-50 rounded-md p-2">{error}</div>}
      {info && <div className="text-sm text-emerald-700 border border-emerald-200 bg-emerald-50 rounded-md p-2">{info}</div>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-accent text-white px-4 py-2 disabled:opacity-50"
      >
        {pending ? "..." : mode === "signup" ? "Создать аккаунт" : "Войти"}
      </button>

      <div className="text-xs text-ink-muted">
        {mode === "signup" ? (
          <>Есть аккаунт? <Link href="/login" className="underline">Войти</Link></>
        ) : (
          <>Нет аккаунта? <Link href="/signup" className="underline">Регистрация</Link></>
        )}
      </div>
    </form>
  );
}
