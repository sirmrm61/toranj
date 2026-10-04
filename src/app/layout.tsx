import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { site } from "@/content/site";
import { env } from "@/lib/env";
import "./globals.css";

const vazirmatn = localFont({
  src: [
    { path: "./fonts/vazirmatn-arabic-wght-normal.woff2", weight: "100 900", style: "normal" },
    { path: "./fonts/vazirmatn-latin-wght-normal.woff2", weight: "100 900", style: "normal" },
  ],
  variable: "--font-vazirmatn",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(env.appUrl),
  title: { default: `${site.name} | ${site.tagline}`, template: `%s | ${site.name}` },
  description: site.description,
  applicationName: site.name,
  openGraph: {
    type: "website",
    locale: "fa_IR",
    siteName: site.name,
    images: [{ url: "/landing/poster.webp", width: 1920, height: 1200 }],
  },
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#2b211c",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fa" dir="rtl" className={`${vazirmatn.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
