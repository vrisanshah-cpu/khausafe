import vendorsSeed from "@/data/vendors.json";
import type { Vendor } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";

/**
 * Data access layer for vendors. The manually curated local JSON seed is
 * always the base layer (it needs no database to work). Once Supabase is
 * connected, admin-added vendors stored there are merged on top — that's
 * how the catalog grows beyond the hand-curated starting set without a live
 * FSSAI data source to pull from.
 */
export async function getVendors(): Promise<Vendor[]> {
  const seed = vendorsSeed as Vendor[];

  const supabase = await createClient();
  if (!supabase) return seed;

  const { data, error } = await supabase.from("vendors").select("*");
  if (error || !data) {
    if (error) console.error("Failed to load vendors from Supabase:", error.message);
    return seed;
  }

  // A DB row wins over the matching seed row (that's what lets an admin edit
  // a hand-curated vendor's sponsorship/Zomato link — the edit upserts a row
  // into the DB with the same id, which should then take precedence).
  const dbById = new Map((data as Vendor[]).map((v) => [v.id, v]));
  const merged = seed.map((v) => dbById.get(v.id) ?? v);
  const seedIds = new Set(seed.map((v) => v.id));
  const dbOnly = (data as Vendor[]).filter((v) => !seedIds.has(v.id));
  return [...merged, ...dbOnly];
}

export async function getVendorById(id: string): Promise<Vendor | undefined> {
  const vendors = await getVendors();
  return vendors.find((v) => v.id === id);
}
