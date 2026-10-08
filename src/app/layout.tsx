import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";
import { NativeBootstrap } from "@/components/native/NativeBootstrap";
import { OfflineOverlay } from "@/components/native/OfflineOverlay";
import { signOutAction } from "@/lib/supabase/actions";
import { BrandMark } from "@/components/BrandMark";

export const metadata: Metadata = {
  title: "KhauSafe — find street food across India",
  description:
    "Explore sourced street-food vendors across India. Vendor-level certification is shown only when individually verified.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg" },
  applicationName: "KhauSafe",
  appleWebApp: {
    capable: true,
    title: "KhauSafe",
    statusBarStyle: "default",
  },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const cookieStore = await cookies();
  const hasSessionCookie = cookieStore.getAll().some(({ name }) =>
    /^sb-.*-auth-token(?:\.\d+)?$/.test(name)
  );
  const supabase = hasSessionCookie ? await createClient() : null;
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  const admin = isAdminEmail(user?.email);

  return (
    <html lang="en-IN" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-white text-neutral-900">
        <NativeBootstrap />
        <OfflineOverlay />
        <header
          className="sticky top-0 z-40 hidden h-14 shrink-0 items-center justify-between border-b border-neutral-200/80 bg-white/85 px-4 backdrop-blur-md md:flex"
          style={{ paddingTop: "var(--safe-top)", height: "calc(3.5rem + var(--safe-top))" }}
        >
          <Link href="/" className="flex items-center gap-2">
            <BrandMark size={30} />
            <span className="text-base font-bold tracking-tight text-neutral-900">KhauSafe</span>
            <span className="hidden text-xs text-neutral-400 sm:inline">
              street food, clearly sourced
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
