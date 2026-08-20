import { isSupabaseConfigured } from "@/lib/supabase/env";
import { LoginForm } from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <main className="mx-auto max-w-sm px-4 py-12">
      <h1 className="text-xl font-bold text-neutral-900">Sign in</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Accounts keep community hygiene observations from being fully anonymous.
      </p>

      <div className="mt-5">
        {isSupabaseConfigured ? (
          <LoginForm />
        ) : (
          <p className="rounded-md border border-dashed border-neutral-300 bg-neutral-50 p-3 text-sm text-neutral-500">
            Accounts aren&apos;t live yet — this will start working once the database is
            connected.
          </p>
        )}
      </div>
    </main>
  );
}
