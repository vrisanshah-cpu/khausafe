import { HomeClient } from "@/components/HomeClient";
import { getVendors } from "@/lib/vendors";

export default async function Home() {
  const vendors = await getVendors();
  return <HomeClient vendors={vendors} />;
}
