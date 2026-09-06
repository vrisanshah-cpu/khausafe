import Link from "next/link";
import { CATEGORY_LABELS, type ReviewSummary, type Vendor } from "@/lib/types";
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
  vendors: Vendor[];
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
    <ul className="flex flex-col gap-2 p-3">
      {vendors.map((vendor) => {
        const distance = distances?.get(vendor.id);
        const rating = ratings?.get(vendor.id);
        return (
          <li key={vendor.id}>
            <Link
              href={`/vendors/${vendor.id}`}
              className="card flex items-start gap-3 p-3 transition-transform duration-150 active:scale-[0.98] motion-safe:hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-xl">
                {CATEGORY_EMOJI[vendor.category]}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="truncate font-semibold text-neutral-900">{vendor.name}</p>
                  {distance !== undefined && (
                    <span className="shrink-0 whitespace-nowrap text-xs font-medium text-neutral-400">
                      {formatDistance(distance)}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 truncate text-xs text-neutral-500">
                  {vendor.area} &middot; {CATEGORY_LABELS[vendor.category]}
                  {rating && rating.count > 0 && (
                    <span className="text-amber-600"> &middot; ★ {rating.average!.toFixed(1)}</span>
                  )}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
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
