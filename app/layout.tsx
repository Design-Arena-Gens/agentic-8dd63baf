import type { Metadata } from "next";
import "./globals.css";
import { clsx } from "clsx";

export const metadata: Metadata = {
  title: "Aurora Analyst | AI Financial Intelligence",
  description: "AI-powered financial analysis, forecasting, and risk insights for modern operators."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="bg-slate-950">
      <body
        className={clsx(
          "min-h-screen bg-slate-950 text-slate-100",
          "antialiased selection:bg-brand-400/30 selection:text-white"
        )}
      >
        <div className="relative">
          <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[580px] bg-gradient-to-b from-brand-500/25 via-brand-500/5 to-transparent blur-3xl" />
          {children}
        </div>
      </body>
    </html>
  );
}
