// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Immo DSCR Copilot",
  description: "Simulateur de rentabilité immobilière avec copilote IA.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="h-full">
      <body className="min-h-full bg-[#0B1E31] text-slate-50 antialiased">
        <div className="min-h-screen bg-gradient-to-br from-[#0B1E31] via-[#0D4E44] to-[#111827]">
          {children}
        </div>
      </body>
    </html>
  );
}
