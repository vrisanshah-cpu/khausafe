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
    return NextResponse.json({ error: "Sign in to leave a review." }, { status: 401 });
  }

  const body = await request.json();
  const { vendor_id, rating, comment } = body ?? {};

  if (
    typeof vendor_id !== "string" ||
    !vendor_id.trim() ||
    typeof rating !== "number" ||
    !Number.isInteger(rating) ||
    rating < 1 ||
    rating > 5 ||
    typeof comment !== "string" ||
    !comment.trim() ||
    comment.length > 500
  ) {
    return NextResponse.json({ error: "Invalid review." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("reviews")
    .upsert(
      { vendor_id, user_id: user.id, rating, comment: comment.trim() },
      { onConflict: "vendor_id,user_id" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data, { status: 201 });
}
