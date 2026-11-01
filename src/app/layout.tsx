import type { Metadata, Viewport } from "next";
import "@fontsource-variable/plus-jakarta-sans";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import PwaRegister from "@/components/PwaRegister";
import Footer from "@/components/Footer";
import SiteNav from "@/components/SiteNav";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "MyStores – your own online store", template: "%s | MyStores" },
  description: "One platform. Every shop gets its own address. Open your store in minutes and sell on WhatsApp.",
  openGraph: { siteName: "MyStores", type: "website", locale: "en_NG", images: ["/images/home/og.jpg"] },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: [{ media: "(prefers-color-scheme: light)", color: "#f3f6f4" }, { media: "(prefers-color-scheme: dark)", color: "#0c1511" }] };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://firebasestorage.googleapis.com" />
        {/* warm up the servers used by Google sign-in so the sign-in window opens sooner */}
        {process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN && <link rel="preconnect" href={`https://${process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}`} />}
        <link rel="preconnect" href="https://apis.google.com" />
        <link rel="preconnect" href="https://accounts.google.com" />
        <link rel="preconnect" href="https://identitytoolkit.googleapis.com" />
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem("ms-theme");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}` }} />
      </head>
      <body><AuthProvider><PwaRegister /><SiteNav />{children}<Footer /></AuthProvider></body>
    </html>
  );
}
