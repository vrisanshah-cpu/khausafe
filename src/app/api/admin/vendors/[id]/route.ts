import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/adminClient";
import { isAdminEmail } from "@/lib/admin";
import { getVendorById } from "@/lib/vendors";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "The database isn't connected yet." }, { status: 501 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const adminClient = createAdminClient();
  if (!adminClient) {
    return NextResponse.json(
      { error: "Admin writes aren't configured yet (missing SUPABASE_SERVICE_ROLE_KEY)." },
      { status: 501 }
    );
  }

  const existing = await getVendorById(id);
  if (!existing) {
    return NextResponse.json({ error: "Vendor not found." }, { status: 404 });
  }

  const body = await request.json();
  const updated = {
    ...existing,
    ...(typeof body.is_sponsored === "boolean" ? { is_sponsored: body.is_sponsored } : {}),
    ...(typeof body.zomato_url === "string" || body.zomato_url === null
      ? { zomato_url: body.zomato_url || null }
      : {}),
  };

  // Upsert: promotes a hand-curated seed vendor into a live DB row the first
  // time an admin edits it, or updates the existing DB row on later edits.
  const { data, error } = await adminClient.from("vendors").upsert(updated).select().single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}
