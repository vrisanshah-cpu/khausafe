import { HomeClient } from "@/components/HomeClient";
import { getVendors } from "@/lib/vendors";
import { getReviewSummariesByVendor } from "@/lib/reviews";
import { getCityOptions, getVendorCity } from "@/lib/cities";

export default async function Home() {
  const allVendors = await getVendors();
  const cities = getCityOptions(allVendors);
  const vendors = allVendors.filter((vendor) => getVendorCity(vendor) === "Mumbai");
  const ratings = await getReviewSummariesByVendor(vendors.map((vendor) => vendor.id));
  return <HomeClient initialVendors={vendors} initialRatings={ratings} cities={cities} />;
}
