import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/ui/LogoutButton";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-white">
        <div className="max-w-5xl mx-auto flex items-center gap-4 px-4 py-2">
          <Link href="/dashboard" className="font-bold">Promptbook</Link>
          <nav className="flex gap-3 text-sm text-ink-muted">
            <Link href="/dashboard" className="hover:text-ink">Dashboard</Link>
            <span className="opacity-40 cursor-not-allowed">Промпты · P0.2</span>
          </nav>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <span className="text-ink-muted">{user.email}</span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto p-6">{children}</main>
    </div>
  );
}
