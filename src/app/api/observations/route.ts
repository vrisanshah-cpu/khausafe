import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "The database isn't connected yet." },
      { status: 501 }
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to submit an observation." }, { status: 401 });
  }

  const body = await request.json();
  const { vendor_id, checklist_responses } = body ?? {};

  if (typeof vendor_id !== "string" || typeof checklist_responses !== "object") {
    return NextResponse.json({ error: "Invalid submission." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("observations")
    .insert({ vendor_id, user_id: user.id, checklist_responses })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data, { status: 201 });
}
