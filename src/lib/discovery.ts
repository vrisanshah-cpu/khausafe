import type { DiscoveryVendor, Vendor } from "@/lib/types";

export function toDiscoveryVendor(vendor: Vendor): DiscoveryVendor {
  return {
    id: vendor.id,
    name: vendor.name,
    lat: vendor.lat,
    lng: vendor.lng,
    area: vendor.area,
    category: vendor.category,
    certification_status: vendor.certification_status,
    is_sponsored: vendor.is_sponsored,
    zomato_url: vendor.zomato_url,
  };
}
