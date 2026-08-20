import { HomeClient } from "@/components/HomeClient";
import { getVendors } from "@/lib/vendors";
import { getReviewSummariesByVendor } from "@/lib/reviews";

export default async function Home() {
  const vendors = await getVendors();
  const ratings = await getReviewSummariesByVendor(vendors.map((v) => v.id));
  return <HomeClient vendors={vendors} ratings={ratings} />;
}
