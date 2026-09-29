import { readFile } from "node:fs/promises";

const files = ["src/data/vendors.json", "src/data/vendors-osm.json"];
const vendors = (
  await Promise.all(files.map(async (file) => JSON.parse(await readFile(file, "utf8"))))
).flat();

const categories = new Set(["chaat", "juice", "snacks", "sweets", "beverages", "other"]);
const certifications = new Set([
  "clean_street_food_hub",
  "fssai_hygiene_rated",
  "uncertified",
  "unknown",
]);
const ids = new Set();
const errors = [];

for (const [index, vendor] of vendors.entries()) {
  const label = vendor.id || `record ${index}`;
  if (!vendor.id || ids.has(vendor.id)) errors.push(`${label}: missing or duplicate id`);
  ids.add(vendor.id);
  if (!vendor.name?.trim()) errors.push(`${label}: missing name`);
  if (!vendor.area?.trim()) errors.push(`${label}: missing area`);
  if (!categories.has(vendor.category)) errors.push(`${label}: invalid category`);
  if (!certifications.has(vendor.certification_status)) errors.push(`${label}: invalid certification`);
  if (!vendor.source?.trim()) errors.push(`${label}: missing source`);
  if (!Number.isFinite(vendor.lat) || vendor.lat < 6 || vendor.lat > 37.5) {
    errors.push(`${label}: latitude outside India bounds`);
  }
  if (!Number.isFinite(vendor.lng) || vendor.lng < 68 || vendor.lng > 98) {
    errors.push(`${label}: longitude outside India bounds`);
  }
  if (vendor.id.startsWith("osm-") && vendor.certification_status !== "unknown") {
    errors.push(`${label}: imported OSM venue must not claim certification`);
  }
}

if (vendors.length < 10_000) errors.push(`catalog contains only ${vendors.length} vendors`);

if (errors.length > 0) {
  console.error(errors.slice(0, 100).join("\n"));
  console.error(`${errors.length} validation error(s)`);
  process.exit(1);
}

const focusCounts = Object.fromEntries(
  ["Mumbai", "Delhi NCR", "Bengaluru", "Hyderabad", "Chennai", "Kolkata", "Pune"].map(
    (city) => [city, vendors.filter((vendor) => vendor.area.endsWith(city)).length]
  )
);

console.log(`Validated ${vendors.length} unique, sourced Indian food vendors.`);
console.log(JSON.stringify(focusCounts, null, 2));
