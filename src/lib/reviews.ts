import { createClient } from "@/lib/supabase/server";
import type { Review, ReviewSummary } from "@/lib/types";

/**
 * Reviews only exist once Supabase is connected — there's no local-JSON
 * fallback for user-submitted data. Returns [] until then. Only "visible"
 * reviews come back here; hidden (auto-moderated or admin-hidden) ones are
 * excluded by the RLS policy itself, not just filtered client-side.
 */
export async function getReviewsForVendor(vendorId: string): Promise<Review[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("vendor_id", vendorId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load reviews:", error.message);
    return [];
  }

  return data as Review[];
}

export function summarizeReviews(reviews: Review[]): ReviewSummary {
  if (reviews.length === 0) return { count: 0, average: null };
  const total = reviews.reduce((sum, r) => sum + r.rating, 0);
  return { count: reviews.length, average: total / reviews.length };
}

/**
 * Average rating per vendor, for sorting/ranking (e.g. "top rated"). One
 * query for every vendor rather than N — matters once the catalog grows
 * past the hand-curated seed.
 */
export async function getReviewSummariesByVendor(
  vendorIds: string[]
): Promise<Map<string, ReviewSummary>> {
  const summaries = new Map<string, ReviewSummary>();
  if (vendorIds.length === 0) return summaries;

  const supabase = await createClient();
  if (!supabase) return summaries;

  const { data, error } = await supabase
    .from("reviews")
    .select("vendor_id, rating")
    .in("vendor_id", vendorIds);

  if (error || !data) {
    if (error) console.error("Failed to load review summaries:", error.message);
    return summaries;
  }

  const grouped = new Map<string, number[]>();
  for (const row of data as { vendor_id: string; rating: number }[]) {
    const list = grouped.get(row.vendor_id) ?? [];
    list.push(row.rating);
    grouped.set(row.vendor_id, list);
  }

  for (const [vendorId, ratings] of grouped) {
    summaries.set(vendorId, {
      count: ratings.length,
      average: ratings.reduce((a, b) => a + b, 0) / ratings.length,
    });
  }

  return summaries;
}
