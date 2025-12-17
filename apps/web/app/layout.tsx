import "./globals.css";
import type { Metadata } from "next";

import { DebatesSidebar } from "@/components/debates/DebatesSidebar";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/app/providers";

export const metadata: Metadata = {
  title: "llm-debate",
  description: "Two debaters and a judge debate a topic.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-Hant">
      <body className="h-screen overflow-hidden bg-background text-foreground">
        <Providers>
          <main className="grid h-screen w-full min-h-0 gap-4 p-6 lg:grid-cols-[340px_1fr]">
            <DebatesSidebar />
            {children}
          </main>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
