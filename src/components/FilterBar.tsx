"use client";

import { CATEGORY_LABELS, type VendorCategory } from "@/lib/types";

export interface Filters {
  area: string;
  category: VendorCategory | "all";
  certifiedOnly: boolean;
}

const CATEGORY_EMOJI: Record<VendorCategory, string> = {
  chaat: "🌶️",
  juice: "🥤",
  snacks: "🍟",
  sweets: "🍬",
  beverages: "☕",
  other: "🍴",
};

export function FilterBar({
  areas,
  filters,
  onChange,
  query,
  onQueryChange,
  onLocate,
  locating,
  locationError,
}: {
  areas: string[];
  filters: Filters;
  onChange: (filters: Filters) => void;
  query: string;
  onQueryChange: (query: string) => void;
  onLocate: () => void;
  locating: boolean;
  locationError: string | null;
}) {
  return (
    <div className="py-3">
      <div className="flex items-center gap-2 px-3">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400">
            🔍
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search stalls or areas…"
            className="field !rounded-full !py-2 pl-9"
          />
        </div>
        <button
          type="button"
          onClick={onLocate}
          disabled={locating}
          title="Use my location"
          aria-label="Use my location"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-orange-200 bg-orange-50 text-base text-orange-700 transition-colors active:bg-orange-100 disabled:opacity-50"
        >
          {locating ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-orange-300 border-t-orange-600" />
          ) : (
            "📍"
          )}
        </button>
      </div>

      {locationError && <p className="px-3 pt-1.5 text-xs text-red-600">{locationError}</p>}

      <div className="mt-2.5 flex gap-2 overflow-x-auto px-3 pb-0.5 scrollbar-none">
        <button
          type="button"
          onClick={() => onChange({ ...filters, certifiedOnly: !filters.certifiedOnly })}
          className={`chip ${filters.certifiedOnly ? "border-emerald-600 bg-emerald-600 text-white" : "chip-inactive"}`}
        >
          ✓ Certified only
        </button>
        <span className="my-auto h-5 w-px shrink-0 bg-neutral-200" aria-hidden />
        <button
          type="button"
          onClick={() => onChange({ ...filters, category: "all" })}
          className={`chip ${filters.category === "all" ? "chip-active" : "chip-inactive"}`}
        >
          All food
        </button>
        {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => onChange({ ...filters, category: value as VendorCategory })}
            className={`chip ${filters.category === value ? "chip-active" : "chip-inactive"}`}
          >
            <span aria-hidden>{CATEGORY_EMOJI[value as VendorCategory]}</span> {label}
          </button>
        ))}
      </div>

      {areas.length > 1 && (
        <div className="mt-2 flex gap-2 overflow-x-auto px-3 pb-0.5 scrollbar-none">
          <button
            type="button"
            onClick={() => onChange({ ...filters, area: "all" })}
            className={`chip ${filters.area === "all" ? "chip-active" : "chip-inactive"} !py-1.5 text-xs`}
          >
            All areas
          </button>
          {areas.map((area) => (
            <button
              key={area}
              type="button"
              onClick={() => onChange({ ...filters, area })}
              className={`chip ${filters.area === area ? "chip-active" : "chip-inactive"} !py-1.5 text-xs`}
            >
              📍 {area}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
