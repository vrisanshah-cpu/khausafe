import Link from "next/link";
import {
  CATEGORY_LABELS,
  type DiscoveryVendor,
  type ReviewSummary,
  type Vendor,
} from "@/lib/types";
import { CertificationBadge } from "./CertificationBadge";
import { formatDistance } from "@/lib/geo";

const CATEGORY_EMOJI: Record<Vendor["category"], string> = {
  chaat: "🌶️",
  juice: "🥤",
  snacks: "🍟",
  sweets: "🍬",
  beverages: "☕",
  other: "🍴",
};

export function VendorList({
  vendors,
  distances,
  ratings,
}: {
  vendors: DiscoveryVendor[];
  distances?: Map<string, number>;
  ratings?: Map<string, ReviewSummary>;
}) {
  if (vendors.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
        <span className="text-3xl" aria-hidden>
          🔎
        </span>
        <p className="text-sm font-medium text-neutral-600">No stalls match these filters</p>
        <p className="text-xs text-neutral-400">Try clearing a filter or searching a different area.</p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3 md:p-3">
      {vendors.map((vendor) => {
        const distance = distances?.get(vendor.id);
        const rating = ratings?.get(vendor.id);
        return (
          <li key={vendor.id}>
            <Link
              href={`/vendors/${vendor.id}`}
              className="flex min-h-24 items-start gap-3 rounded-[20px] border border-stone-200/80 bg-white p-3.5 shadow-[0_2px_12px_rgba(45,31,15,0.04)] active:bg-orange-50 md:rounded-2xl"
            >
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-2xl">
                {CATEGORY_EMOJI[vendor.category]}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="line-clamp-2 text-[15px] font-bold leading-snug text-stone-950">{vendor.name}</p>
                  {distance !== undefined && (
                    <span className="shrink-0 whitespace-nowrap text-xs font-bold text-orange-700">
                      {formatDistance(distance)}
                    </span>
                  )}
                </div>
                <p className="mt-1 line-clamp-1 text-xs text-stone-500">
                  {vendor.area} &middot; {CATEGORY_LABELS[vendor.category]}
                  {rating && rating.count > 0 && (
                    <span className="text-amber-600"> &middot; ★ {rating.average!.toFixed(1)}</span>
                  )}
                </p>
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  <CertificationBadge status={vendor.certification_status} />
                  {vendor.is_sponsored && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                      ★ Sponsored
                    </span>
                  )}
                </div>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
