"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import type { ReviewSummary, Vendor } from "@/lib/types";
import { getAreas } from "@/lib/areas";
import { distanceKm } from "@/lib/geo";
import { FilterBar, type Filters } from "./FilterBar";
import { VendorList } from "./VendorList";
import { TopPicksStrip } from "./TopPicksStrip";

const MapView = dynamic(() => import("./MapView").then((mod) => mod.MapView), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-neutral-400">
      Loading map…
    </div>
  ),
});

export function HomeClient({
  vendors,
  ratings,
}: {
  vendors: Vendor[];
  ratings: Map<string, ReviewSummary>;
}) {
  const areas = useMemo(() => getAreas(vendors), [vendors]);
  const [filters, setFilters] = useState<Filters>({
    area: "all",
    category: "all",
    certification: "all",
  });
  const [query, setQuery] = useState("");
  const [mobileView, setMobileView] = useState<"map" | "list">("map");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  function handleLocate() {
    if (!navigator.geolocation) {
      setLocationError("Location isn't available in this browser.");
      return;
    }
    setLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      (err) => {
        setLocationError(
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied — enable it in your browser to find nearby stalls."
            : "Couldn't get your location."
        );
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return vendors.filter(
      (v) =>
        (filters.area === "all" || v.area === filters.area) &&
        (filters.category === "all" || v.category === filters.category) &&
        (filters.certification === "all" || v.certification_status === filters.certification) &&
        (q === "" || v.name.toLowerCase().includes(q) || v.area.toLowerCase().includes(q))
    );
  }, [vendors, filters, query]);

  const distances = useMemo(() => {
    if (!userLocation) return undefined;
    const map = new Map<string, number>();
    for (const v of vendors) map.set(v.id, distanceKm(userLocation, v));
    return map;
  }, [vendors, userLocation]);

  const sorted = useMemo(() => {
    if (!distances) return filtered;
    return [...filtered].sort((a, b) => (distances.get(a.id) ?? 0) - (distances.get(b.id) ?? 0));
  }, [filtered, distances]);

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col md:flex-row">
      <aside className="flex w-full flex-col border-r border-neutral-200 md:h-full md:w-96">
        <FilterBar
          areas={areas}
          filters={filters}
          onChange={setFilters}
          query={query}
          onQueryChange={setQuery}
          onLocate={handleLocate}
          locating={locating}
          locationError={locationError}
        />

        {query === "" && filters.area === "all" && filters.category === "all" && filters.certification === "all" && (
          <TopPicksStrip vendors={vendors} ratings={ratings} />
        )}

        <div className="flex border-b border-neutral-200 md:hidden">
          <button
            type="button"
            onClick={() => setMobileView("map")}
            className={`flex-1 py-2 text-sm font-medium ${
              mobileView === "map" ? "border-b-2 border-orange-600 text-orange-700" : "text-neutral-500"
            }`}
          >
            Map
          </button>
          <button
            type="button"
            onClick={() => setMobileView("list")}
            className={`flex-1 py-2 text-sm font-medium ${
              mobileView === "list" ? "border-b-2 border-orange-600 text-orange-700" : "text-neutral-500"
            }`}
          >
            List
          </button>
        </div>

        <div className={mobileView === "list" ? "flex-1 overflow-y-auto md:block" : "hidden flex-1 overflow-y-auto md:block"}>
          <VendorList vendors={sorted} distances={distances} ratings={ratings} />
        </div>
      </aside>
      <main className={mobileView === "map" ? "h-full flex-1" : "hidden flex-1 md:block"}>
        <MapView vendors={sorted} userLocation={userLocation} />
      </main>
    </div>
  );
}
