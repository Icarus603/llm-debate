import "./globals.css";
import type { Metadata } from "next";

import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "llm-debate",
  description: "Two debaters and a judge debate a topic.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="h-screen overflow-hidden bg-background text-foreground">
        <main className="flex h-screen w-full flex-col p-6">
          {children}
        </main>
        <Toaster />
      </body>
    </html>
  );
}
