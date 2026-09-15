"use client";

import dynamic from "next/dynamic";
import { useMemo, useRef, useState } from "react";
import type { ReviewSummary, Vendor } from "@/lib/types";
import { getAreas } from "@/lib/areas";
import { distanceKm } from "@/lib/geo";
import { FilterBar, type Filters } from "./FilterBar";
import { VendorList } from "./VendorList";
import { TopPicksStrip } from "./TopPicksStrip";
import { useBottomSheet } from "./useBottomSheet";

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
    certifiedOnly: false,
  });
  const [query, setQuery] = useState("");
  const mainRef = useRef<HTMLElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const sheet = useBottomSheet(mainRef, sheetRef);
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
        (!filters.certifiedOnly ||
          v.certification_status === "clean_street_food_hub" ||
          v.certification_status === "fssai_hygiene_rated") &&
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

  const showTopPicks =
    query === "" && filters.area === "all" && filters.category === "all" && !filters.certifiedOnly;

  return (
    <div className="flex h-[calc(100dvh-3.5rem-var(--safe-top))] flex-col md:flex-row">
      {/* Desktop sidebar — always-visible list alongside the map */}
      <aside className="hidden w-96 shrink-0 flex-col border-r border-neutral-200 md:flex">
        <div className="border-b border-neutral-200 px-3 pt-3">
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
        </div>
        {showTopPicks && <TopPicksStrip vendors={vendors} ratings={ratings} />}
        <div className="flex-1 overflow-y-auto">
          <VendorList vendors={sorted} distances={distances} ratings={ratings} />
        </div>
      </aside>

      {/* Mobile — full-bleed map with a floating search bar and a draggable bottom sheet */}
      <main ref={mainRef} className="relative h-full flex-1 overflow-hidden">
        {/* Leaflet's internal panes (markers/popups/tooltips) use z-indexes up
            to 700+ with no stacking context of their own — `isolate` here
            contains them so they can never paint over the search bar or
            bottom sheet below, regardless of where a marker/popup lands. */}
        <div
          className="absolute inset-0 isolate"
          onClick={() => sheet.snap !== "peek" && sheet.goTo("peek")}
        >
          <MapView vendors={sorted} userLocation={userLocation} />
        </div>

        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 p-3 md:hidden">
          <div className="pointer-events-auto rounded-2xl bg-white/95 shadow-[var(--shadow-float)] backdrop-blur-sm">
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
          </div>
        </div>

        {/* Google Maps-style bottom sheet: drag the handle freely, or tap it
            to cycle peek → half → full. Height is driven imperatively via
            the ref during drag (see useBottomSheet) so touch-move never
            waits on a React re-render of the map/list underneath. */}
        <div
          ref={sheetRef}
          className={`absolute inset-x-0 bottom-0 z-20 flex flex-col overflow-hidden rounded-t-2xl bg-white shadow-[var(--shadow-float)] md:hidden ${
            sheet.dragging ? "" : "transition-[height] duration-300 ease-out"
          }`}
          style={{ height: sheet.heightPx, paddingBottom: "var(--safe-bottom)" }}
        >
          <button
            type="button"
            onPointerDown={sheet.onHandlePointerDown}
            onPointerMove={sheet.onHandlePointerMove}
            onPointerUp={sheet.onHandlePointerUp}
            onPointerCancel={sheet.onHandlePointerUp}
            onClick={(e) => {
              e.stopPropagation();
              sheet.cycle();
            }}
            style={{ touchAction: "none" }}
            className="flex shrink-0 flex-col items-center gap-1.5 pt-2.5 pb-1 active:opacity-70"
            aria-label={sheet.snap === "peek" ? "Expand stall list" : "Collapse stall list"}
          >
            <span className="h-1.5 w-10 rounded-full bg-neutral-300" />
            <span className="text-xs font-medium text-neutral-500">
              {sheet.snap === "peek"
                ? `${sorted.length} stall${sorted.length === 1 ? "" : "s"} nearby`
                : "Drag to resize"}
            </span>
          </button>
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {showTopPicks && <TopPicksStrip vendors={vendors} ratings={ratings} />}
            <VendorList vendors={sorted} distances={distances} ratings={ratings} />
          </div>
        </div>
      </main>
    </div>
  );
}
