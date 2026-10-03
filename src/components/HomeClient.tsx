"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { type DiscoveryVendor, type ReviewSummary, type VendorCategory } from "@/lib/types";
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

const QUICK_CATEGORIES: { value: VendorCategory | "all"; label: string; icon: string }[] = [
  { value: "all", label: "All food", icon: "✦" },
  { value: "chaat", label: "Chaat", icon: "🌶️" },
  { value: "snacks", label: "Snacks", icon: "🥟" },
  { value: "sweets", label: "Sweets", icon: "🍮" },
  { value: "beverages", label: "Drinks", icon: "☕" },
  { value: "juice", label: "Juice", icon: "🥤" },
];

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
  const [visibleCount, setVisibleCount] = useState(24);
  const [mobileView, setMobileView] = useState<"discover" | "map">("discover");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
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
          setVisibleCount(24);
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
  const mapVendors = useMemo(() => sorted.slice(0, 60), [sorted]);

  function handleFilterChange(nextFilters: Filters) {
    setFilters(nextFilters);
    setVisibleCount(24);
  }

  function handleQueryChange(nextQuery: string) {
    setQuery(nextQuery);
    setVisibleCount(24);
    if (nextQuery.trim()) setMobileView("discover");
  }

  const showTopPicks =
    query === "" && filters.area === "all" && filters.category === "all" && !filters.certifiedOnly;

  return (
    <div className="flex h-[calc(100dvh-3.5rem-var(--safe-top))] min-h-0 flex-col md:flex-row">
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

      <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[#faf8f4] md:hidden">
        <div className="z-20 shrink-0 border-b border-stone-200/80 bg-[#faf8f4] px-4 pb-3 pt-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-orange-700">The street food guide</p>
              <h1 className="mt-1 text-[27px] font-extrabold leading-tight tracking-tight text-stone-950">Good food, found.</h1>
            </div>
            <button type="button" onClick={handleLocate} disabled={locating} className="flex h-11 shrink-0 items-center gap-1.5 rounded-2xl border border-stone-200 bg-white px-3 text-xs font-bold text-stone-800 shadow-sm disabled:opacity-50" aria-label="Find stalls near my location">
              <span className="text-lg text-orange-600">⌖</span>{locating ? "Finding" : "Near me"}
            </button>
          </div>
          <div className="mt-4 flex gap-2">
            <label className="flex h-12 min-w-0 flex-1 items-center gap-2 rounded-2xl border border-stone-200 bg-white px-3 shadow-sm focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-100">
              <span aria-hidden className="text-lg text-stone-500">⌕</span>
              <input type="search" value={query} onChange={(event) => handleQueryChange(event.target.value)} placeholder="Stall, dish or neighbourhood" aria-label="Search stalls, dishes or areas" className="min-w-0 flex-1 bg-transparent text-[15px] text-stone-950 outline-none placeholder:text-stone-400" />
            </label>
            <button type="button" onClick={() => setMobileFiltersOpen(true)} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-stone-950 text-xl text-white shadow-sm" aria-label="Open filters">☷</button>
          </div>
          <div className="mt-3 flex items-center justify-between gap-2">
            <label className="flex min-w-0 items-center gap-1 text-sm font-semibold text-stone-700">
              <span aria-hidden className="text-orange-600">●</span>
              <select value={filters.city} onChange={(event) => handleFilterChange({ ...filters, city: event.target.value, area: "all" })} aria-label="Choose city" className="max-w-[190px] appearance-none bg-transparent pr-4 font-semibold outline-none">
                {cities.map((city) => <option key={city} value={city}>{city}</option>)}
              </select>
              <span aria-hidden className="-ml-3 text-stone-500">⌄</span>
            </label>
            <span className="shrink-0 text-xs font-medium text-stone-500">{cityLoading ? "Updating…" : `${sorted.length.toLocaleString()} places`}</span>
          </div>
          {locationError && <p role="status" className="mt-2 text-xs text-red-700">{locationError}</p>}
          <div className="scrollbar-none -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-0.5">
            {QUICK_CATEGORIES.map((item) => (
              <button key={item.value} type="button" onClick={() => handleFilterChange({ ...filters, category: item.value })} aria-pressed={filters.category === item.value} className={`shrink-0 rounded-full border px-3.5 py-2 text-[13px] font-semibold ${filters.category === item.value ? "border-orange-600 bg-orange-600 text-white" : "border-stone-200 bg-white text-stone-700"}`}>
                <span aria-hidden>{item.icon}</span> {item.label}
              </button>
            ))}
          </div>
        </div>

        {mobileView === "discover" ? (
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-5 pt-5">
            <div className="mb-3 flex items-end justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-orange-700">Explore {filters.city}</p>
                <h2 className="mt-1 text-xl font-bold tracking-tight text-stone-950">Places to try</h2>
              </div>
              {userLocation && <span className="text-xs font-medium text-stone-500">Sorted by distance</span>}
            </div>
            <p className="mb-4 text-xs leading-relaxed text-stone-500">Browse sourced places. Certification is shown only when verified.</p>
            {cityLoading && <p role="status" className="mb-3 rounded-xl bg-white p-3 text-sm text-stone-600">Loading more places in {filters.city}…</p>}
            {cityError && <p role="alert" className="mb-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{cityError}</p>}
            <VendorList vendors={visibleVendors} distances={distances} ratings={ratings} />
            {visibleCount < sorted.length && <button type="button" onClick={() => setVisibleCount((count) => count + 24)} className="mt-4 w-full rounded-2xl border border-stone-200 bg-white py-3 text-sm font-bold text-stone-900">Show more places</button>}
          </div>
        ) : (
          <div className="relative min-h-0 flex-1 isolate">
            <MapView vendors={mapVendors} fitVendors={cityVendors} userLocation={userLocation} />
            <div className="pointer-events-none absolute inset-x-4 bottom-4 z-[1000] rounded-2xl bg-white/95 p-3 text-center text-xs font-semibold text-stone-800 shadow-lg">Showing {mapVendors.length} pins · Browse the full list for more</div>
          </div>
        )}

        <nav aria-label="Explore views" className="z-20 flex shrink-0 border-t border-stone-200 bg-white px-4 pt-2" style={{ paddingBottom: "max(0.5rem, var(--safe-bottom))" }}>
          <button type="button" onClick={() => setMobileView("discover")} aria-current={mobileView === "discover" ? "page" : undefined} className={`flex min-h-12 flex-1 flex-col items-center justify-center rounded-xl text-xs font-bold ${mobileView === "discover" ? "bg-orange-50 text-orange-700" : "text-stone-500"}`}><span className="text-xl" aria-hidden>▤</span>Discover</button>
          <button type="button" onClick={() => setMobileView("map")} aria-current={mobileView === "map" ? "page" : undefined} className={`flex min-h-12 flex-1 flex-col items-center justify-center rounded-xl text-xs font-bold ${mobileView === "map" ? "bg-orange-50 text-orange-700" : "text-stone-500"}`}><span className="text-xl" aria-hidden>⌖</span>Map</button>
        </nav>

        {mobileFiltersOpen && <div className="absolute inset-0 z-50 flex items-end bg-stone-950/40" onClick={() => setMobileFiltersOpen(false)}>
          <section role="dialog" aria-modal="true" aria-label="Filter places" onClick={(event) => event.stopPropagation()} className="max-h-[85dvh] w-full overflow-y-auto rounded-t-[28px] bg-white p-5 pb-8 shadow-2xl" style={{ paddingBottom: "max(2rem, var(--safe-bottom))" }}>
            <div className="flex items-center justify-between"><h2 className="text-xl font-bold text-stone-950">Filter places</h2><button type="button" onClick={() => setMobileFiltersOpen(false)} aria-label="Close filters" className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 text-lg">×</button></div>
            <label className="mt-5 block text-sm font-bold text-stone-800">Neighbourhood
              <select value={filters.area} onChange={(event) => handleFilterChange({ ...filters, area: event.target.value })} className="mt-2 h-12 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm font-medium">
                <option value="all">All neighbourhoods</option>
                {filters.area !== "all" && !areas.includes(filters.area) && <option value={filters.area}>{filters.area}</option>}
                {areas.map((area) => <option key={area} value={area}>{area}</option>)}
              </select>
            </label>
            <label className="mt-5 flex items-center justify-between gap-4 rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-950"><span>Verified certification only</span><input type="checkbox" checked={filters.certifiedOnly} onChange={(event) => handleFilterChange({ ...filters, certifiedOnly: event.target.checked })} className="h-5 w-5 accent-emerald-700" /></label>
            <div className="mt-6 flex gap-2"><button type="button" onClick={() => handleFilterChange({ ...filters, area: "all", category: "all", certifiedOnly: false })} className="h-12 flex-1 rounded-xl border border-stone-200 text-sm font-bold text-stone-800">Reset</button><button type="button" onClick={() => setMobileFiltersOpen(false)} className="h-12 flex-[2] rounded-xl bg-orange-600 text-sm font-bold text-white">Show {sorted.length.toLocaleString()} places</button></div>
          </section>
        </div>}
      </main>
    </div>
  );
}
