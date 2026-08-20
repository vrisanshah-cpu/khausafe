import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/adminClient";
import { isAdminEmail, adminConfigured } from "@/lib/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getVendors } from "@/lib/vendors";
import type { Review } from "@/lib/types";
import { AddVendorForm } from "@/components/admin/AddVendorForm";
import { VendorAdminList } from "@/components/admin/VendorAdminList";
import { ModerationQueue } from "@/components/admin/ModerationQueue";

export default async function AdminPage() {
  if (!isSupabaseConfigured) {
    return (
      <Notice title="Admin isn't live yet">
        This page needs the database connected — add stalls, sponsorship, and review moderation
        all read and write through Supabase, which isn&apos;t configured yet.
      </Notice>
    );
  }

  const supabase = await createClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;

  if (!user) {
    return (
      <Notice title="Sign in required">
        <Link href="/login" className="font-medium text-orange-700 hover:underline">
          Sign in
        </Link>{" "}
        with an admin account to continue.
      </Notice>
    );
  }

  if (!adminConfigured) {
    return (
      <Notice title="No admins configured">
        Set the <code className="rounded bg-neutral-100 px-1">ADMIN_EMAILS</code> environment
        variable (comma-separated) in Vercel to grant admin access.
      </Notice>
    );
  }

  if (!isAdminEmail(user.email)) {
    return (
      <Notice title="Not authorized">
        {user.email} isn&apos;t on the admin list.
      </Notice>
    );
  }

  const vendors = await getVendors();

  const adminClient = createAdminClient();
  let hiddenReviews: Review[] = [];
  if (adminClient) {
    const { data } = await adminClient
      .from("reviews")
      .select("*")
      .eq("status", "hidden")
      .order("created_at", { ascending: false });
    hiddenReviews = (data as Review[]) ?? [];
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-neutral-900">Admin</h1>
      <p className="mt-1 text-sm text-neutral-500">Signed in as {user.email}</p>

      {!adminClient && (
        <p className="mt-4 rounded-md border border-dashed border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
          Writes are disabled — set <code className="rounded bg-white px-1">SUPABASE_SERVICE_ROLE_KEY</code>{" "}
          in Vercel to enable adding stalls, sponsorship, and review moderation.
        </p>
      )}

      <section className="mt-6">
        <h2 className="text-lg font-semibold text-neutral-900">Add a stall</h2>
        <div className="mt-3">
          <AddVendorForm />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-neutral-900">Sponsorship &amp; Zomato links</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Sponsorship is opt-in per stall — only mark a vendor sponsored once they&apos;ve
          actually agreed to paid placement.
        </p>
        <div className="mt-3">
          <VendorAdminList vendors={vendors} />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-neutral-900">
          Review moderation queue ({hiddenReviews.length})
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          Reviews land here automatically once several different users report them.
        </p>
        <div className="mt-3">
          <ModerationQueue reviews={hiddenReviews} vendors={vendors} />
        </div>
      </section>
    </main>
  );
}

function Notice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="text-lg font-semibold text-neutral-900">{title}</h1>
      <p className="mt-2 text-sm text-neutral-500">{children}</p>
    </main>
  );
}
