import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "WritGo AI - WordPress SEO Agent",
  description: "Automated WordPress content generation with AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
