"use client";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();
  const onLogout = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  };
  return (
    <button onClick={onLogout} className="px-3 py-1 border border-line rounded-md bg-white hover:bg-stripe">
      Выйти
    </button>
  );
}
