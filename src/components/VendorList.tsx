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

const CATEGORY_COLOR: Record<Vendor["category"], string> = {
  chaat: "bg-[#ffd0be]",
  juice: "bg-[#c8f4de]",
  snacks: "bg-[#ffe6a7]",
  sweets: "bg-[#efceff]",
  beverages: "bg-[#cdd8ff]",
  other: "bg-[#e5e5df]",
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
    <ul className="flex flex-col gap-2.5 md:p-3">
      {vendors.map((vendor) => {
        const distance = distances?.get(vendor.id);
        const rating = ratings?.get(vendor.id);
        return (
          <li key={vendor.id}>
            <a
              href={`/vendors/${vendor.id}`}
              className="group flex min-h-[104px] items-center gap-3 rounded-[22px] bg-white p-3 shadow-[0_10px_25px_-24px_rgba(20,20,15,.65)] transition active:scale-[0.99] md:rounded-2xl"
            >
              <span className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-[18px] text-4xl ${CATEGORY_COLOR[vendor.category]}`}>
                {CATEGORY_EMOJI[vendor.category]}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="line-clamp-2 text-[15px] font-black leading-snug tracking-[-0.01em] text-[#171714]">{vendor.name}</p>
                  {distance !== undefined && (
                    <span className="shrink-0 whitespace-nowrap rounded-full bg-[#f1f1ec] px-2 py-1 text-[10px] font-black text-stone-600">
                      {formatDistance(distance)}
                    </span>
                  )}
                </div>
                <p className="mt-1 line-clamp-1 text-[11px] font-semibold text-stone-500">
                  {vendor.area} &middot; {CATEGORY_LABELS[vendor.category]}
                  {rating && rating.count > 0 && (
                    <span className="text-amber-600"> &middot; ★ {rating.average!.toFixed(1)}</span>
                  )}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {vendor.certification_status !== "unknown" && <CertificationBadge status={vendor.certification_status} />}
                  {vendor.is_sponsored && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                      ★ Sponsored
                    </span>
                  )}
                  {vendor.certification_status === "unknown" && !vendor.is_sponsored && (
                    <span className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-stone-400">Source checked</span>
                  )}
                </div>
              </div>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#171714] text-sm font-bold text-white transition group-active:bg-[#dfff55] group-active:text-black">↗</span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
