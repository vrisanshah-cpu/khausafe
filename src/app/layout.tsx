import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";

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

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const supabase = await createClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  const admin = isAdminEmail(user?.email);

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-white text-neutral-900">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-neutral-200 px-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-lg font-bold text-orange-600">KhauSafe</span>
            <span className="hidden text-xs text-neutral-500 sm:inline">
              hygiene-rated street food, on a map
            </span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            {admin && (
              <Link href="/admin" className="font-medium text-neutral-600 hover:text-orange-700">
                Admin
              </Link>
            )}
            {!user && (
              <Link href="/login" className="font-medium text-orange-700 hover:underline">
                Sign in
              </Link>
            )}
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
