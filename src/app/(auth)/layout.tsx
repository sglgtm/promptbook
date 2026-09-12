export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white border border-line rounded-lg p-6 shadow-sm">{children}</div>
    </main>
  );
}
