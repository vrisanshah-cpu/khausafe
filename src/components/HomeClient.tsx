"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import type { DiscoveryVendor, ReviewSummary } from "@/lib/types";
import { getPopularAreas } from "@/lib/areas";
import { getNearestPrimaryCity } from "@/lib/cities";
import { distanceKm } from "@/lib/geo";
import {
  cacheDiscoveryPreferences,
  cacheVendors,
  getCachedDiscoveryPreferences,
} from "@/lib/offline/vendorCache";
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
  initialVendors,
  initialRatings,
  cities,
}: {
  initialVendors: DiscoveryVendor[];
  initialRatings: Map<string, ReviewSummary>;
  cities: string[];
}) {
  const [vendors, setVendors] = useState(initialVendors);
  const [ratings, setRatings] = useState(initialRatings);
  const [loadedCity, setLoadedCity] = useState("Mumbai");
  const [catalogComplete, setCatalogComplete] = useState(false);
  const [cityLoadError, setCityLoadError] = useState<{ city: string; message: string } | null>(null);
  const [visibleCount, setVisibleCount] = useState(50);
  const [mobileListOpen, setMobileListOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    city: "Mumbai",
    area: "all",
    category: "all",
    certifiedOnly: false,
  });
  const [query, setQuery] = useState("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const cityError = cityLoadError?.city === filters.city ? cityLoadError.message : null;
  const cityLoading = (filters.city !== loadedCity || !catalogComplete) && cityError === null;
  const cityVendors = useMemo(
    () => (filters.city === loadedCity ? vendors : []),
    [filters.city, loadedCity, vendors]
  );
  const areas = useMemo(() => getPopularAreas(cityVendors), [cityVendors]);

  useEffect(() => {
    if (filters.city === loadedCity && catalogComplete) return;
    const controller = new AbortController();

    fetch(`/api/vendors?city=${encodeURIComponent(filters.city)}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load this city.");
        return (await response.json()) as {
          vendors: DiscoveryVendor[];
          ratings: Record<string, ReviewSummary>;
        };
      })
      .then((payload) => {
        setVendors(payload.vendors);
        setRatings(new Map(Object.entries(payload.ratings)));
        setLoadedCity(filters.city);
        setCatalogComplete(true);
        setCityLoadError(null);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setCityLoadError({
          city: filters.city,
          message: "Couldn’t load this city. Check your connection and try again.",
        });
      });

    return () => controller.abort();
  }, [filters.city, loadedCity, catalogComplete]);

  useEffect(() => {
    getCachedDiscoveryPreferences()
      .then((saved) => {
        if (!saved || !cities.includes(saved.city)) return;
        setFilters({
          city: saved.city,
          area: saved.area,
          category: saved.category,
          certifiedOnly: saved.certifiedOnly,
        });
        setQuery(saved.query);
      })
      .catch(() => {});
  }, [cities]);

  useEffect(() => {
    cacheVendors(vendors).catch(() => {});
  }, [vendors]);

  useEffect(() => {
    cacheDiscoveryPreferences({ ...filters, query }).catch(() => {});
  }, [filters, query]);

  function handleLocate() {
    if (!navigator.geolocation) {
      setLocationError("Location isn't available in this browser.");
      return;
    }
    setLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(location);
        const nearestCity = getNearestPrimaryCity(location);
        if (nearestCity) {
          setFilters((current) => ({
            ...current,
            city: nearestCity,
            area: "all",
          }));
          setVisibleCount(50);
        }
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
    return cityVendors.filter(
      (v) =>
        (filters.area === "all" || v.area === filters.area) &&
        (filters.category === "all" || v.category === filters.category) &&
        (!filters.certifiedOnly ||
          v.certification_status === "clean_street_food_hub" ||
          v.certification_status === "fssai_hygiene_rated") &&
        (q === "" || v.name.toLowerCase().includes(q) || v.area.toLowerCase().includes(q))
    );
  }, [cityVendors, filters, query]);

  const distances = useMemo(() => {
    if (!userLocation) return undefined;
    const map = new Map<string, number>();
    for (const v of cityVendors) map.set(v.id, distanceKm(userLocation, v));
    return map;
  }, [cityVendors, userLocation]);

  const sorted = useMemo(() => {
    if (!distances) return filtered;
    return [...filtered].sort((a, b) => (distances.get(a.id) ?? 0) - (distances.get(b.id) ?? 0));
  }, [filtered, distances]);
  const visibleVendors = useMemo(() => sorted.slice(0, visibleCount), [sorted, visibleCount]);
  const mapVendors = useMemo(() => sorted.slice(0, 80), [sorted]);

  function handleFilterChange(nextFilters: Filters) {
    setFilters(nextFilters);
    setVisibleCount(50);
    setMobileListOpen(true);
  }

  function handleQueryChange(nextQuery: string) {
    setQuery(nextQuery);
    setVisibleCount(50);
    if (nextQuery.trim()) setMobileListOpen(true);
  }

  const showTopPicks =
    query === "" && filters.area === "all" && filters.category === "all" && !filters.certifiedOnly;

  return (
    <div className="flex h-[calc(100dvh-3.5rem-var(--safe-top))] flex-col md:flex-row">
      {/* Desktop sidebar — always-visible list alongside the map */}
      <aside className="hidden w-96 shrink-0 flex-col border-r border-neutral-200 md:flex">
        <div className="border-b border-neutral-200 px-3 pt-3">
          <FilterBar
            cities={cities}
            areas={areas}
            filters={filters}
            onChange={handleFilterChange}
            query={query}
            onQueryChange={handleQueryChange}
            onLocate={handleLocate}
            locating={locating}
            locationError={locationError}
          />
        </div>
        {showTopPicks && <TopPicksStrip vendors={cityVendors} ratings={ratings} />}
        <div className="flex-1 overflow-y-auto">
          {cityLoading && (
            <p className="px-4 py-3 text-sm text-neutral-500">Loading {filters.city}…</p>
          )}
          {cityError && <p className="px-4 py-3 text-sm text-red-600">{cityError}</p>}
          <VendorList vendors={visibleVendors} distances={distances} ratings={ratings} />
          {visibleCount < sorted.length && (
            <button
              type="button"
              onClick={() => setVisibleCount((count) => count + 50)}
              className="btn-secondary mx-3 mb-4 w-[calc(100%-1.5rem)]"
            >
              Show more ({sorted.length - visibleCount} remaining)
            </button>
          )}
        </div>
      </aside>

      {/* Mobile — full-bleed map with compact search and a stable results sheet */}
      <main className="relative h-full flex-1 overflow-hidden">
        {/* Leaflet's internal panes (markers/popups/tooltips) use z-indexes up
            to 700+ with no stacking context of their own — `isolate` here
            contains them so they can never paint over the search bar or
            bottom sheet below, regardless of where a marker/popup lands. */}
        <div
          className="absolute inset-0 isolate"
          onClick={() => mobileListOpen && setMobileListOpen(false)}
        >
          <MapView vendors={mapVendors} fitVendors={cityVendors} userLocation={userLocation} />
        </div>

        <div className="pointer-events-none absolute inset-x-0 top-0 z-30 p-3 md:hidden">
          <div className="pointer-events-auto rounded-2xl bg-white/95 shadow-[var(--shadow-float)] backdrop-blur-sm">
            <FilterBar
              cities={cities}
              areas={areas}
              filters={filters}
              onChange={handleFilterChange}
              query={query}
              onQueryChange={handleQueryChange}
              onLocate={handleLocate}
              locating={locating}
              locationError={locationError}
            />
          </div>
        </div>

        {/* A two-state results sheet is intentionally used on mobile. It is
            predictable under iOS/Android browser chrome and avoids running
            pointer-move state beside a live map. */}
        <div
          className={`absolute inset-x-0 bottom-0 z-20 flex flex-col overflow-hidden rounded-t-3xl border-t border-neutral-200 bg-white shadow-[var(--shadow-float)] transition-[height] duration-200 ease-out md:hidden ${
            mobileListOpen ? "h-[min(68dvh,620px)]" : "h-[104px]"
          }`}
          style={{ paddingBottom: "var(--safe-bottom)" }}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMobileListOpen((open) => !open);
            }}
            className="flex h-[74px] shrink-0 flex-col items-center justify-center gap-1.5 active:bg-neutral-50"
            aria-expanded={mobileListOpen}
            aria-label={mobileListOpen ? "Collapse stall list" : "Expand stall list"}
          >
            <span className="h-1.5 w-10 rounded-full bg-neutral-300" />
            <span className="text-sm font-semibold text-neutral-800">
              {sorted.length.toLocaleString()} place{sorted.length === 1 ? "" : "s"}
            </span>
            <span className="text-[11px] text-neutral-400">
              {mobileListOpen ? "Tap to return to map" : "Tap to browse results"}
            </span>
          </button>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {cityLoading && (
              <p className="px-4 py-3 text-sm text-neutral-500">Loading {filters.city}…</p>
            )}
            {cityError && <p className="px-4 py-3 text-sm text-red-600">{cityError}</p>}
            {showTopPicks && <TopPicksStrip vendors={cityVendors} ratings={ratings} />}
            <VendorList vendors={visibleVendors} distances={distances} ratings={ratings} />
            {visibleCount < sorted.length && (
              <button
                type="button"
                onClick={() => setVisibleCount((count) => count + 50)}
                className="btn-secondary mx-3 mb-4 w-[calc(100%-1.5rem)]"
              >
                Show more ({sorted.length - visibleCount} remaining)
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
