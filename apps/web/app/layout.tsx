import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "llm-debate",
  description: "Two debaters and a judge debate a topic.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main>{children}</main>
      </body>
    </html>
  );
}

