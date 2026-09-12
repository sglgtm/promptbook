import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Promptbook",
  description: "Повторяемые AI-workflow для маркетинга и SEO",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}
