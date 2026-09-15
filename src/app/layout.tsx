import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";
import { NativeBootstrap } from "@/components/native/NativeBootstrap";
import { OfflineOverlay } from "@/components/native/OfflineOverlay";
import { signOutAction } from "@/lib/supabase/actions";

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
        <NativeBootstrap />
        <OfflineOverlay />
        <header
          className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between border-b border-neutral-200/80 bg-white/85 px-4 backdrop-blur-md"
          style={{ paddingTop: "var(--safe-top)", height: "calc(3.5rem + var(--safe-top))" }}
        >
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-600 text-sm shadow-sm">
              🍢
            </span>
            <span className="text-base font-bold tracking-tight text-neutral-900">KhauSafe</span>
            <span className="hidden text-xs text-neutral-400 sm:inline">
              hygiene-rated street food
            </span>
          </Link>
          <div className="flex items-center gap-4 text-sm">
            {admin && (
              <Link href="/admin" className="font-medium text-neutral-500 hover:text-orange-700">
                Admin
              </Link>
            )}
            {user ? (
              <form action={signOutAction} className="flex items-center gap-2">
                <span className="hidden max-w-[9rem] truncate text-xs text-neutral-400 sm:inline">
                  {user.email}
                </span>
                <button type="submit" className="btn-secondary !px-3 !py-1.5 text-xs">
                  Sign out
                </button>
              </form>
            ) : (
              <Link href="/login" className="btn-primary !px-3.5 !py-1.5 text-xs">
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
