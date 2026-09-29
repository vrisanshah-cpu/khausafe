import type { Vendor } from "@/lib/types";
import { distanceKm } from "@/lib/geo";

export const PRIMARY_CITIES = [
  "Mumbai",
  "Delhi NCR",
  "Bengaluru",
  "Hyderabad",
  "Chennai",
  "Kolkata",
  "Pune",
] as const;

const PRIMARY_CITY_CENTERS: Record<(typeof PRIMARY_CITIES)[number], { lat: number; lng: number }> = {
  Mumbai: { lat: 19.076, lng: 72.8777 },
  "Delhi NCR": { lat: 28.6139, lng: 77.209 },
  Bengaluru: { lat: 12.9716, lng: 77.5946 },
  Hyderabad: { lat: 17.385, lng: 78.4867 },
  Chennai: { lat: 13.0827, lng: 80.2707 },
  Kolkata: { lat: 22.5726, lng: 88.3639 },
  Pune: { lat: 18.5204, lng: 73.8567 },
};

const CITY_ALIASES: Array<[RegExp, string]> = [
  [/\b(mumbai|thane|navi mumbai)\b/i, "Mumbai"],
  [/\b(delhi|noida|gurugram|gurgaon|faridabad|ghaziabad)\b/i, "Delhi NCR"],
  [/\b(bengaluru|bangalore)\b/i, "Bengaluru"],
  [/\bhyderabad\b/i, "Hyderabad"],
  [/\bchennai\b/i, "Chennai"],
  [/\bkolkata\b/i, "Kolkata"],
  [/\bpune\b/i, "Pune"],
  [/\bahmedabad\b/i, "Ahmedabad"],
  [/\bjaipur\b/i, "Jaipur"],
  [/\blucknow\b/i, "Lucknow"],
  [/\bsurat\b/i, "Surat"],
  [/\bchandigarh\b/i, "Chandigarh"],
  [/\bkochi\b/i, "Kochi"],
  [/\bindore\b/i, "Indore"],
  [/\b(mysuru|mysore)\b/i, "Mysore"],
  [/\b(trichy|tiruchirappalli)\b/i, "Trichy"],
  [/\b(thiruvananthapuram|trivandrum)\b/i, "Thiruvananthapuram"],
  [/\b(jammu city|jammu)\b/i, "Jammu"],
  [/\b(old bhopal|bhopal)\b/i, "Bhopal"],
];

/**
 * Produces a stable, user-facing Indian city/metro label from the deliberately
 * flexible area strings in the manually curated dataset. Major metros are
 * canonicalised first; the final locality segment is a safe fallback for the
 * long tail of Indian cities.
 */
export function getVendorCity(vendor: Pick<Vendor, "area">): string {
  for (const [pattern, city] of CITY_ALIASES) {
    if (pattern.test(vendor.area)) return city;
  }

  const parts = vendor.area
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  return (parts.at(-1) ?? "Other India")
    .replace(/^near\s+/i, "")
    .replace(/\s+district$/i, "")
    .replace(/\s+town$/i, "")
    .trim();
}

export function getCityOptions(vendors: Vendor[]): string[] {
  const counts = new Map<string, number>();
  for (const vendor of vendors) {
    const city = getVendorCity(vendor);
    counts.set(city, (counts.get(city) ?? 0) + 1);
  }

  const priority = new Map<string, number>(PRIMARY_CITIES.map((city, index) => [city, index]));

  return [...counts.keys()].sort((a, b) => {
    const priorityA = priority.get(a);
    const priorityB = priority.get(b);
    if (priorityA !== undefined || priorityB !== undefined) {
      return (priorityA ?? Number.MAX_SAFE_INTEGER) - (priorityB ?? Number.MAX_SAFE_INTEGER);
    }
    const countDifference = (counts.get(b) ?? 0) - (counts.get(a) ?? 0);
    return countDifference || a.localeCompare(b);
  });
}

export function getNearestPrimaryCity(location: { lat: number; lng: number }) {
  let nearest: { city: (typeof PRIMARY_CITIES)[number]; distance: number } | null = null;
  for (const city of PRIMARY_CITIES) {
    const distance = distanceKm(location, PRIMARY_CITY_CENTERS[city]);
    if (!nearest || distance < nearest.distance) nearest = { city, distance };
  }
  return nearest && nearest.distance <= 250 ? nearest.city : null;
}
