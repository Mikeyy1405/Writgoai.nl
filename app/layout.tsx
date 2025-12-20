import type { Metadata } from "next";
import "./globals.css";


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
        {children}
      </body>
    </html>
  );
}
