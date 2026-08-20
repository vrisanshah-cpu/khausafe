import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/adminClient";
import { isAdminEmail } from "@/lib/admin";

async function requireAdmin() {
  const supabase = await createClient();
  if (!supabase) {
    return { error: NextResponse.json({ error: "The database isn't connected yet." }, { status: 501 }) };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) {
    return { error: NextResponse.json({ error: "Not authorized." }, { status: 403 }) };
  }

  const adminClient = createAdminClient();
  if (!adminClient) {
    return {
      error: NextResponse.json(
        { error: "Admin writes aren't configured yet (missing SUPABASE_SERVICE_ROLE_KEY)." },
        { status: 501 }
      ),
    };
  }

  return { adminClient };
}

// Restore a hidden review (clears report_count too, so it isn't re-hidden by stale reports).
export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error, adminClient } = await requireAdmin();
  if (error) return error;

  const { data, error: dbError } = await adminClient!
    .from("reviews")
    .update({ status: "visible", report_count: 0 })
    .eq("id", id)
    .select()
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 400 });
  return NextResponse.json(data);
}

// Permanently delete a review (for genuinely bad content, not just a wrongly-hidden one).
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error, adminClient } = await requireAdmin();
  if (error) return error;

  const { error: dbError } = await adminClient!.from("reviews").delete().eq("id", id);
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
