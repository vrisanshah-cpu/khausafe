import { createClient } from "@/lib/supabase/server";
import type { Observation } from "@/lib/types";

/**
 * Community observations only exist once Supabase is connected — there's no
 * local-JSON fallback for user-submitted data. Returns [] until then.
 */
export async function getObservationsForVendor(vendorId: string): Promise<Observation[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("observations")
    .select("*")
    .eq("vendor_id", vendorId)
    .order("submitted_at", { ascending: false });

  if (error) {
    console.error("Failed to load observations:", error.message);
    return [];
  }

  return data as Observation[];
}

export function summarizeObservations(observations: Observation[]) {
  const count = observations.length;
  if (count === 0) {
    return { count: 0, cleanPrepPct: 0, glovesPct: 0, coveredStoragePct: 0, cleanWaterPct: 0 };
  }

  const pct = (key: keyof Observation["checklist_responses"]) =>
    Math.round(
      (observations.filter((o) => o.checklist_responses[key] === true).length / count) * 100
    );

  return {
    count,
    cleanPrepPct: pct("clean_prep_surface"),
    glovesPct: pct("gloves_or_utensils_used"),
    coveredStoragePct: pct("covered_food_storage"),
    cleanWaterPct: pct("clean_water_access"),
  };
}
