import Link from "next/link";
import { PromptForm } from "@/components/ui/PromptForm";

export const dynamic = "force-dynamic";

export default function NewPromptPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Новый промпт</h1>
        <Link href="/dashboard" className="text-sm text-neutral-600 hover:underline">← К списку</Link>
      </div>
      <div className="rounded-lg border border-neutral-200 bg-white p-4">
        <PromptForm mode="create" />
      </div>
    </div>
  );
}
