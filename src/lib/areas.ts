/** Client-safe (no Supabase server import) — used from client components. */
export function getPopularAreas(vendors: Array<{ area: string }>, limit = 18): string[] {
  const counts = new Map<string, number>();
  for (const vendor of vendors) counts.set(vendor.area, (counts.get(vendor.area) ?? 0) + 1);
  return [...counts]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([area]) => area);
}
