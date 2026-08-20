"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import type { Vendor } from "@/lib/types";
import { getAreas } from "@/lib/vendors";
import { FilterBar, type Filters } from "./FilterBar";
import { VendorList } from "./VendorList";

const MapView = dynamic(() => import("./MapView").then((mod) => mod.MapView), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-neutral-400">
      Loading map…
    </div>
  ),
});

export function HomeClient({ vendors }: { vendors: Vendor[] }) {
  const areas = useMemo(() => getAreas(vendors), [vendors]);
  const [filters, setFilters] = useState<Filters>({
    area: "all",
    category: "all",
    certification: "all",
  });

  const filtered = useMemo(
    () =>
      vendors.filter(
        (v) =>
          (filters.area === "all" || v.area === filters.area) &&
          (filters.category === "all" || v.category === filters.category) &&
          (filters.certification === "all" || v.certification_status === filters.certification)
      ),
    [vendors, filters]
  );

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col md:flex-row">
      <aside className="flex w-full flex-col border-r border-neutral-200 md:h-full md:w-96">
        <FilterBar areas={areas} filters={filters} onChange={setFilters} />
        <VendorList vendors={filtered} />
      </aside>
      <main className="h-80 flex-1 md:h-full">
        <MapView vendors={filtered} />
      </main>
    </div>
  );
}
