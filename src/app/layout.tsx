import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "MyStores", description: "One platform. Every shop gets its own address." };
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@500;700&family=DM+Sans:wght@400;500;700&display=swap" />
      </head>
      <body>{children}</body>
    </html>
  );
}
