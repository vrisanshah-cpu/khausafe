import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const CURATED_PATH = path.join(ROOT, "src", "data", "vendors.json");
const OUTPUT_PATH = path.join(ROOT, "src", "data", "vendors-osm.json");
const TARGET_TOTAL = Number(process.env.TARGET_TOTAL ?? 10_250);

// Priority order intentionally reflects KhauSafe's India launch strategy.
const MARKETS = [
  { city: "Mumbai", bbox: [18.85, 72.75, 19.35, 73.1] },
  { city: "Delhi NCR", bbox: [28.2, 76.7, 28.95, 77.55] },
  { city: "Bengaluru", bbox: [12.73, 77.35, 13.22, 77.85] },
  { city: "Hyderabad", bbox: [17.2, 78.2, 17.65, 78.75] },
  { city: "Chennai", bbox: [12.8, 80.05, 13.3, 80.35] },
  { city: "Kolkata", bbox: [22.35, 88.15, 22.75, 88.55] },
  { city: "Pune", bbox: [18.35, 73.65, 18.75, 74.05] },
  { city: "Ahmedabad", bbox: [22.85, 72.4, 23.2, 72.75] },
  { city: "Jaipur", bbox: [26.75, 75.65, 27.1, 76.0] },
  { city: "Lucknow", bbox: [26.7, 80.75, 27.0, 81.1] },
  { city: "Surat", bbox: [21.05, 72.65, 21.35, 72.95] },
  { city: "Indore", bbox: [22.55, 75.7, 22.9, 76.05] },
  { city: "Nagpur", bbox: [20.95, 78.95, 21.3, 79.25] },
  { city: "Kochi", bbox: [9.75, 76.15, 10.2, 76.5] },
  { city: "Chandigarh", bbox: [30.55, 76.6, 30.85, 76.95] },
  { city: "Patna", bbox: [25.45, 84.95, 25.75, 85.35] },
  { city: "Bhubaneswar", bbox: [20.15, 85.65, 20.45, 86.0] },
  { city: "Coimbatore", bbox: [10.85, 76.8, 11.2, 77.15] },
  { city: "Visakhapatnam", bbox: [17.55, 83.1, 17.9, 83.45] },
];

const ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

function queryFor([south, west, north, east]) {
  const bbox = `${south},${west},${north},${east}`;
  return `[out:json][timeout:180][maxsize:536870912];(
    nwr["name"]["amenity"~"^(fast_food|cafe|ice_cream|food_court|restaurant)$"](${bbox});
    nwr["name"]["shop"~"^(bakery|confectionery|tea|coffee)$"](${bbox});
    nwr["name"]["street_vendor"="yes"](${bbox});
  );out center tags;`;
}

async function fetchMarket(market) {
  const body = new URLSearchParams({ data: queryFor(market.bbox) });
  let lastError;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const endpoint = ENDPOINTS[attempt % ENDPOINTS.length];
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          "User-Agent": "KhauSafe-data-import/1.0 (github.com/vrisanshah-cpu/khausafe)",
        },
        body,
        signal: AbortSignal.timeout(240_000),
      });

      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      const payload = await response.json();
      return payload.elements ?? [];
    } catch (error) {
      lastError = error;
      const waitMilliseconds = 15_000 * (attempt + 1);
      console.warn(`${market.city}: ${String(error)}; retrying in ${waitMilliseconds / 1000}s`);
      await sleep(waitMilliseconds);
    }
  }

  throw lastError;
}

function normalizeName(value = "") {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/&amp;/g, "&")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function haversineKm(a, b) {
  const radius = 6371;
  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * radius * Math.asin(Math.sqrt(h));
}

function categoryFor(tags) {
  const cuisine = String(tags.cuisine ?? "").toLowerCase();
  if (/chaat|pani_puri|bhel|golgappa/.test(cuisine)) return "chaat";
  if (/juice|smoothie/.test(cuisine)) return "juice";
  if (tags.amenity === "ice_cream" || tags.shop === "confectionery") return "sweets";
  if (tags.amenity === "cafe" || ["tea", "coffee"].includes(tags.shop)) return "beverages";
  if (tags.amenity === "fast_food" || tags.shop === "bakery") return "snacks";
  return "other";
}

function coordinatesFor(element) {
  const lat = element.lat ?? element.center?.lat;
  const lng = element.lon ?? element.center?.lon;
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}

function areaFor(tags, city) {
  const locality =
    tags["addr:neighbourhood"] ??
    tags["addr:suburb"] ??
    tags["addr:quarter"] ??
    tags["addr:street"];
  if (!locality || normalizeName(locality) === normalizeName(city)) return city;
  return `${String(locality).trim()}, ${city}`;
}

function toVendor(element, city) {
  const coordinates = coordinatesFor(element);
  const name = String(element.tags?.name ?? "").replace(/&amp;/g, "&").trim();
  if (!coordinates || !name) return null;

  const type = element.type;
  const venueKind =
    element.tags.street_vendor === "yes"
      ? "street vendor"
      : element.tags.amenity ?? element.tags.shop ?? "food venue";

  return {
    id: `osm-${type}-${element.id}`,
    name,
    lat: coordinates.lat,
    lng: coordinates.lng,
    area: areaFor(element.tags, city),
    category: categoryFor(element.tags),
    certification_status: "unknown",
    source: `OpenStreetMap ${type}/${element.id} (${venueKind}), imported Sep 2026 under ODbL: https://www.openstreetmap.org/${type}/${element.id}. FSSAI certification was not independently verified. Coordinates are the exact mapped OSM position.`,
  };
}

function isDuplicate(candidate, acceptedByName, curatedByName) {
  const normalized = normalizeName(candidate.name);
  const nearby = [...(acceptedByName.get(normalized) ?? []), ...(curatedByName.get(normalized) ?? [])];
  return nearby.some((vendor) => haversineKm(candidate, vendor) < 0.15);
}

function addToNameIndex(index, vendor) {
  const key = normalizeName(vendor.name);
  const list = index.get(key) ?? [];
  list.push(vendor);
  index.set(key, list);
}

const curated = JSON.parse(await readFile(CURATED_PATH, "utf8"));
const curatedByName = new Map();
for (const vendor of curated) addToNameIndex(curatedByName, vendor);

const imported = [];
const importedByName = new Map();

for (const market of MARKETS) {
  if (curated.length + imported.length >= TARGET_TOTAL) break;
  console.log(`Fetching ${market.city}...`);
  const elements = await fetchMarket(market);
  let added = 0;

  for (const element of elements) {
    const vendor = toVendor(element, market.city);
    if (!vendor || isDuplicate(vendor, importedByName, curatedByName)) continue;
    imported.push(vendor);
    addToNameIndex(importedByName, vendor);
    added += 1;
    if (curated.length + imported.length >= TARGET_TOTAL) break;
  }

  console.log(`${market.city}: ${elements.length} mapped, ${added} added; total ${curated.length + imported.length}`);
  await sleep(2_000);
}

if (curated.length + imported.length < 10_000) {
  throw new Error(`Only ${curated.length + imported.length} real vendors were collected; refusing to pad the dataset.`);
}

await writeFile(OUTPUT_PATH, `${JSON.stringify(imported, null, 2)}\n`, "utf8");
console.log(`Wrote ${imported.length} sourced OSM vendors to ${OUTPUT_PATH}`);
console.log(`Combined catalog: ${curated.length + imported.length}`);
