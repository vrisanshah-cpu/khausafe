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
}: {
  areas: string[];
  filters: Filters;
  onChange: (filters: Filters) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 border-b border-neutral-200 bg-white p-3">
      <select
        value={filters.area}
        onChange={(e) => onChange({ ...filters, area: e.target.value })}
        className="rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm"
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
        className="rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm"
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
        className="rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm"
      >
        <option value="all">All certification statuses</option>
        {Object.entries(CERTIFICATION_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}
