import vendorsSeed from "@/data/vendors.json";
import type { Vendor } from "@/lib/types";

/**
 * Data access layer for vendors. Reads from the manually curated local JSON
 * seed for now. Once a real Supabase project + confirmed FSSAI data source
 * are wired up, swap the body of these functions for Supabase queries
 * (`supabase.from("vendors").select("*")`) without touching call sites.
 */
export async function getVendors(): Promise<Vendor[]> {
  return vendorsSeed as Vendor[];
}

export async function getVendorById(id: string): Promise<Vendor | undefined> {
  const vendors = await getVendors();
  return vendors.find((v) => v.id === id);
}

export function getAreas(vendors: Vendor[]): string[] {
  return Array.from(new Set(vendors.map((v) => v.area))).sort();
}
