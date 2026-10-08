import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "./env";

/** Server-side Supabase client (Server Components, Route Handlers). Returns null until env vars are set. */
export async function createClient() {
  if (!isSupabaseConfigured) return null;

  const cookieStore = await cookies();

  return createServerClient(supabaseUrl!, supabaseAnonKey!, {
    global: {
      fetch(input, init) {
        if ((init?.method ?? "GET").toUpperCase() !== "GET") return fetch(input, init);
        const timeout = AbortSignal.timeout(3000);
        const signal = init?.signal ? AbortSignal.any([init.signal, timeout]) : timeout;
        return fetch(input, { ...init, signal });
      },
    },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from a Server Component with no request context to mutate — safe to ignore
          // because middleware refreshes the session on every request.
        }
      },
    },
  });
}
