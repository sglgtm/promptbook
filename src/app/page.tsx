import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="max-w-xl mx-auto p-10">
      <h1 className="text-2xl font-bold mb-3">Promptbook</h1>
      <p className="text-ink-muted mb-6">
        Повторяемые AI-workflow для маркетологов и SEO. P0: сохраняешь промпт с переменными, собираешь
        инструкцию, отправляешь в Perplexity, оцениваешь результат, повторяешь.
      </p>
      <div className="flex gap-3">
        <Link href="/login" className="px-4 py-2 border border-line rounded-md bg-white">Войти</Link>
        <Link href="/signup" className="px-4 py-2 rounded-md bg-accent text-white">Регистрация</Link>
      </div>
    </main>
  );
}
