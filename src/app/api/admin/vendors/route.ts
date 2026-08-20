import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/adminClient";
import { isAdminEmail } from "@/lib/admin";
import type { CertificationStatus, VendorCategory } from "@/lib/types";

const CATEGORIES: VendorCategory[] = ["chaat", "juice", "snacks", "sweets", "beverages", "other"];
const STATUSES: CertificationStatus[] = [
  "clean_street_food_hub",
  "fssai_hygiene_rated",
  "uncertified",
  "unknown",
];

export async function POST(request: Request) {
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

  const body = await request.json();
  const {
    id,
    name,
    lat,
    lng,
    area,
    category,
    certification_status,
    source,
    is_sponsored,
    zomato_url,
  } = body ?? {};

  if (
    typeof id !== "string" ||
    !id.trim() ||
    typeof name !== "string" ||
    !name.trim() ||
    typeof lat !== "number" ||
    typeof lng !== "number" ||
    typeof area !== "string" ||
    !area.trim() ||
    !CATEGORIES.includes(category) ||
    !STATUSES.includes(certification_status) ||
    typeof source !== "string" ||
    !source.trim()
  ) {
    return NextResponse.json({ error: "Invalid vendor submission." }, { status: 400 });
  }

  const { data, error } = await adminClient
    .from("vendors")
    .insert({
      id: id.trim(),
      name: name.trim(),
      lat,
      lng,
      area: area.trim(),
      category,
      certification_status,
      source: source.trim(),
      is_sponsored: Boolean(is_sponsored),
      zomato_url: typeof zomato_url === "string" && zomato_url.trim() ? zomato_url.trim() : null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data, { status: 201 });
}
