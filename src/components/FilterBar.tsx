"use client";

import { useState } from "react";
import { CATEGORY_LABELS, type VendorCategory } from "@/lib/types";

export interface Filters {
  city: string;
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
  cities,
  areas,
  filters,
  onChange,
  query,
  onQueryChange,
  onLocate,
  locating,
  locationError,
}: {
  cities: string[];
  areas: string[];
  filters: Filters;
  onChange: (filters: Filters) => void;
  query: string;
  onQueryChange: (query: string) => void;
  onLocate: () => void;
  locating: boolean;
  locationError: string | null;
}) {
  const [showFilters, setShowFilters] = useState(false);
  const activeFilterCount =
    Number(filters.category !== "all") +
    Number(filters.area !== "all");
  const areaOptions =
    filters.area !== "all" && !areas.includes(filters.area) ? [filters.area, ...areas] : areas;

  return (
    <div className="relative p-2.5">
      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <span aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400">
            🔍
          </span>
          <input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search food or area"
            aria-label="Search food stalls or areas"
            className="field h-11 !rounded-xl !py-2 pl-9 pr-3"
          />
        </div>
        <button
          type="button"
          onClick={onLocate}
          disabled={locating}
          title="Use my location"
          aria-label="Use my location"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-600 text-base text-white shadow-sm active:scale-95 disabled:opacity-50"
        >
          {locating ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-orange-200 border-t-white" />
          ) : (
            "◎"
          )}
        </button>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Choose an Indian city</span>
          <select
            value={filters.city}
            onChange={(event) => onChange({ ...filters, city: event.target.value, area: "all" })}
            className="h-9 w-full appearance-none rounded-xl border border-neutral-200 bg-white pl-3 pr-8 text-sm font-semibold text-neutral-800 focus:border-orange-500 focus:outline-none"
            aria-label="Choose an Indian city"
          >
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
          <span aria-hidden className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">▾</span>
        </label>
        <button
          type="button"
          onClick={() => setShowFilters((open) => !open)}
          aria-expanded={showFilters}
          className={`relative flex h-9 shrink-0 items-center gap-1.5 rounded-xl border px-3 text-sm font-semibold transition-colors ${
            showFilters || activeFilterCount > 0
              ? "border-orange-600 bg-orange-50 text-orange-700"
              : "border-neutral-200 bg-white text-neutral-700"
          }`}
        >
          <span aria-hidden>☷</span> Filters
          {activeFilterCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-600 px-1 text-[11px] text-white">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {locationError && <p className="px-1 pt-1.5 text-xs text-red-600">{locationError}</p>}

      {showFilters && (
        <div className="absolute inset-x-2 top-full z-50 mt-1 rounded-2xl border border-neutral-200 bg-white p-3 shadow-[var(--shadow-float)]">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-neutral-900">Refine results</p>
            <button type="button" onClick={() => setShowFilters(false)} className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-600" aria-label="Close filters">
              ✕
            </button>
          </div>

          <p className="mt-3 text-[11px] font-bold uppercase tracking-wide text-neutral-400">Food type</p>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <button
              type="button"
              onClick={() => onChange({ ...filters, category: "all" })}
              className={`rounded-xl border px-3 py-2 text-left text-sm font-medium ${filters.category === "all" ? "border-orange-600 bg-orange-50 text-orange-700" : "border-neutral-200 text-neutral-700"}`}
            >
              🍽️ All food
            </button>
            {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => onChange({ ...filters, category: value as VendorCategory })}
                className={`rounded-xl border px-3 py-2 text-left text-sm font-medium ${filters.category === value ? "border-orange-600 bg-orange-50 text-orange-700" : "border-neutral-200 text-neutral-700"}`}
              >
                {CATEGORY_EMOJI[value as VendorCategory]} {label}
              </button>
            ))}
          </div>

          <label className="mt-3 block text-[11px] font-bold uppercase tracking-wide text-neutral-400">
            Popular area
            <select
              value={filters.area}
              onChange={(event) => onChange({ ...filters, area: event.target.value })}
              className="field mt-1.5 h-10 !rounded-xl !py-1 text-sm font-medium normal-case tracking-normal"
            >
              <option value="all">All areas</option>
              {areaOptions.map((area) => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
          </label>

          <div className="mt-3 flex gap-2">
            <button type="button" onClick={() => onChange({ ...filters, area: "all", category: "all", certifiedOnly: false })} className="btn-secondary flex-1 !py-2">
              Reset
            </button>
            <button type="button" onClick={() => setShowFilters(false)} className="btn-primary flex-1 !py-2">
              Show results
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
