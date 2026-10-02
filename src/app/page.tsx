import { HomeClient } from "@/components/HomeClient";
import { getVendors } from "@/lib/vendors";
import { getReviewSummariesByVendor } from "@/lib/reviews";
import { getCityOptions, getVendorCity } from "@/lib/cities";
import { toDiscoveryVendor } from "@/lib/discovery";

export default async function Home() {
  const allVendors = await getVendors();
  const cities = getCityOptions(allVendors);
  const fullVendors = allVendors.filter((vendor) => getVendorCity(vendor) === "Mumbai");
  // Keep the first paint tiny; HomeClient hydrates the complete city catalog
  // from the cached API after the map is interactive.
  const previewVendors = fullVendors.slice(0, 80);
  const ratings = await getReviewSummariesByVendor(previewVendors.map((vendor) => vendor.id));
  const vendors = previewVendors.map(toDiscoveryVendor);
  return <HomeClient initialVendors={vendors} initialRatings={ratings} cities={cities} />;
}
