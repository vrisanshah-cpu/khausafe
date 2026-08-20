import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KhauSafe — Hygiene-rated street food near you",
  description:
    "Find street food vendors with official FSSAI Clean Street Food Hub certification and community-observed hygiene signals, on a map.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-white text-neutral-900">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-neutral-200 px-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-lg font-bold text-emerald-700">KhauSafe</span>
            <span className="hidden text-xs text-neutral-500 sm:inline">
              hygiene-rated street food, on a map
            </span>
          </Link>
        </header>
        {children}
      </body>
    </html>
  );
}
