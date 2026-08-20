import type { Vendor } from "@/lib/types";

/** Client-safe (no Supabase server import) — used from client components. */
export function getAreas(vendors: Vendor[]): string[] {
  return Array.from(new Set(vendors.map((v) => v.area))).sort();
}
