import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "@/components/LoginForm";

export default async function LoginPage(props: PageProps<"/login">) {
  const { error } = await props.searchParams;

  const supabase = await createClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  if (user) redirect("/");

  return (
    <main className="mx-auto max-w-sm px-4 py-14 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-2xl">
        🍢
      </span>
      <h1 className="mt-4 text-xl font-bold text-neutral-900">Sign in to KhauSafe</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Accounts keep community hygiene observations from being fully anonymous.
      </p>

      {error && (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          That sign-in link didn&apos;t work — it may have expired or already been used. Request
          a new one below.
        </p>
      )}

      <div className="mt-6 text-left">
        {isSupabaseConfigured ? (
          <LoginForm />
        ) : (
          <p className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-3 text-sm text-neutral-500">
            Accounts aren&apos;t live yet — this will start working once the database is
            connected.
          </p>
        )}
      </div>
    </main>
  );
}
