import { HomeClient } from "@/components/HomeClient";
import { getVendors } from "@/lib/vendors";
import { getCityOptions, getVendorCity } from "@/lib/cities";
import { toDiscoveryVendor } from "@/lib/discovery";

export default async function Home() {
  // Render the discovery feed from the local catalog immediately. Database-only
  // additions remain available to admin/API routes without delaying every visit.
  const allVendors = await getVendors({ includeDatabase: false });
  const cities = getCityOptions(allVendors);
  const fullVendors = allVendors.filter((vendor) => getVendorCity(vendor) === "Mumbai");
  // Keep the first paint tiny; HomeClient hydrates the complete city catalog
  // from the cached API after the map is interactive.
  const previewVendors = fullVendors.slice(0, 80);
  const vendors = previewVendors.map(toDiscoveryVendor);
  return <HomeClient initialVendors={vendors} initialRatings={new Map()} cities={cities} />;
}
