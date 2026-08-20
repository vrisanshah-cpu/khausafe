import Link from "next/link";
import { CATEGORY_LABELS, type ReviewSummary, type Vendor } from "@/lib/types";
import { CertificationBadge } from "./CertificationBadge";
import { formatDistance } from "@/lib/geo";

const CATEGORY_DOT: Record<Vendor["category"], string> = {
  chaat: "bg-orange-500",
  juice: "bg-pink-500",
  snacks: "bg-blue-500",
  sweets: "bg-purple-500",
  beverages: "bg-teal-500",
  other: "bg-neutral-500",
};

export function VendorList({
  vendors,
  distances,
  ratings,
}: {
  vendors: Vendor[];
  distances?: Map<string, number>;
  ratings?: Map<string, ReviewSummary>;
}) {
  if (vendors.length === 0) {
    return (
      <p className="p-4 text-sm text-neutral-500">
        No vendors match these filters yet.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-neutral-200 overflow-y-auto">
      {vendors.map((vendor) => {
        const distance = distances?.get(vendor.id);
        const rating = ratings?.get(vendor.id);
        return (
          <li key={vendor.id}>
            <Link
              href={`/vendors/${vendor.id}`}
              className="block px-4 py-3 hover:bg-orange-50/60"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${CATEGORY_DOT[vendor.category]}`}
                    aria-hidden
                  />
                  <div>
                    <p className="font-medium text-neutral-900">
                      {vendor.name}
                      {vendor.is_sponsored && (
                        <span className="ml-1.5 text-xs font-semibold text-amber-600">★ Sponsored</span>
                      )}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {vendor.area} &middot; {CATEGORY_LABELS[vendor.category]}
                      {rating && rating.count > 0 && (
                        <>
                          {" "}
                          &middot; <span className="text-amber-600">★ {rating.average!.toFixed(1)}</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>
                {distance !== undefined && (
                  <span className="shrink-0 whitespace-nowrap text-xs font-medium text-neutral-500">
                    {formatDistance(distance)}
                  </span>
                )}
              </div>
              <div className="mt-2 pl-4">
                <CertificationBadge status={vendor.certification_status} />
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
