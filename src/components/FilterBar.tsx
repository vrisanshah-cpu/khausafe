"use client";

import { CATEGORY_LABELS, CERTIFICATION_LABELS, type CertificationStatus, type VendorCategory } from "@/lib/types";

export interface Filters {
  area: string;
  category: VendorCategory | "all";
  certification: CertificationStatus | "all";
}

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
    <div className="border-b border-neutral-200 bg-white">
      <div className="flex items-center gap-2 p-3 pb-2">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
            🔍
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search stalls or areas…"
            className="w-full rounded-full border border-neutral-300 bg-neutral-50 py-2 pl-9 pr-3 text-sm focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
          />
        </div>
        <button
          type="button"
          onClick={onLocate}
          disabled={locating}
          title="Use my location"
          className="flex shrink-0 items-center gap-1 rounded-full border border-orange-300 bg-orange-50 px-3 py-2 text-sm font-medium text-orange-700 hover:bg-orange-100 disabled:opacity-50"
        >
          {locating ? "…" : "📍"}
        </button>
      </div>

      {locationError && (
        <p className="px-3 pb-1 text-xs text-red-600">{locationError}</p>
      )}

      <div className="flex flex-wrap gap-2 px-3 pb-3">
        <select
          value={filters.area}
          onChange={(e) => onChange({ ...filters, area: e.target.value })}
          className="rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700"
        >
          <option value="all">All areas</option>
          {areas.map((area) => (
            <option key={area} value={area}>
              {area}
            </option>
          ))}
        </select>

        <select
          value={filters.category}
          onChange={(e) => onChange({ ...filters, category: e.target.value as Filters["category"] })}
          className="rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700"
        >
          <option value="all">All categories</option>
          {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <select
          value={filters.certification}
          onChange={(e) =>
            onChange({ ...filters, certification: e.target.value as Filters["certification"] })
          }
          className="rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700"
        >
          <option value="all">All certification statuses</option>
          {Object.entries(CERTIFICATION_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
