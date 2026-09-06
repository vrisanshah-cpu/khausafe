import Link from "next/link";
import type { ReviewSummary, Vendor } from "@/lib/types";

const CERT_WEIGHT: Record<Vendor["certification_status"], number> = {
  clean_street_food_hub: 2,
  fssai_hygiene_rated: 2,
  uncertified: 1,
  unknown: 0,
};

const CATEGORY_EMOJI: Record<Vendor["category"], string> = {
  chaat: "🌶️",
  juice: "🥤",
  snacks: "🍟",
  sweets: "🍬",
  beverages: "☕",
  other: "🍴",
};

export function TopPicksStrip({
  vendors,
  ratings,
}: {
  vendors: Vendor[];
  ratings: Map<string, ReviewSummary>;
}) {
  const picks = [...vendors]
    .sort((a, b) => {
      if (a.is_sponsored !== b.is_sponsored) return a.is_sponsored ? -1 : 1;
      const ratingA = ratings.get(a.id)?.average ?? -1;
      const ratingB = ratings.get(b.id)?.average ?? -1;
      if (ratingA !== ratingB) return ratingB - ratingA;
      return CERT_WEIGHT[b.certification_status] - CERT_WEIGHT[a.certification_status];
    })
    .slice(0, 8);

  if (picks.length === 0) return null;

  return (
    <div className="bg-gradient-to-b from-orange-50/70 to-transparent px-3 pt-3 pb-1">
      <h2 className="mb-2 flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-orange-700">
        🔥 Top picks
      </h2>
      <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none">
        {picks.map((vendor) => {
          const rating = ratings.get(vendor.id);
          return (
            <Link
              key={vendor.id}
              href={`/vendors/${vendor.id}`}
              className="card flex w-32 shrink-0 flex-col p-2.5 transition-transform duration-150 active:scale-[0.97] motion-safe:hover:-translate-y-0.5"
            >
              <span className="text-lg">{CATEGORY_EMOJI[vendor.category]}</span>
              <span className="mt-1 line-clamp-2 text-xs font-medium text-neutral-900">
                {vendor.name}
              </span>
              <span className="mt-1 text-[11px] text-neutral-500">
                {vendor.is_sponsored ? (
                  <span className="font-semibold text-amber-600">★ Sponsored</span>
                ) : rating && rating.count > 0 ? (
                  <span className="text-amber-600">★ {rating.average!.toFixed(1)}</span>
                ) : (
                  <span className="text-neutral-400">New</span>
                )}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
