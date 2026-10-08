"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
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
  const [isDesktop, setIsDesktop] = useState(false);
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
    const media = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

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
          certifiedOnly: false,
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
  const mapVendors = useMemo(() => {
    const cells = new Set<string>();
    const pins: DiscoveryVendor[] = [];
    for (const vendor of sorted) {
      const cell = `${Math.round(vendor.lat / 0.006)}:${Math.round(vendor.lng / 0.006)}`;
      if (cells.has(cell)) continue;
      cells.add(cell);
      pins.push(vendor);
      if (pins.length === 40) break;
    }
    return pins;
  }, [sorted]);

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
    query === "" && filters.area === "all" && filters.category === "all";

  const featuredVendor = visibleVendors[0];
  const popularVendors = visibleVendors.slice(1, 7);

  return (
    <div className="flex h-[100dvh] min-h-0 flex-col bg-[#f4f4ef] md:h-[calc(100dvh-3.5rem-var(--safe-top))] md:flex-row">
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

      {isDesktop && <div className="hidden min-h-0 flex-1 isolate md:block"><MapView vendors={mapVendors} fitVendors={mapVendors} userLocation={userLocation} /></div>}

      <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[#f4f4ef] md:hidden">
        <header className="z-20 shrink-0 px-5 pb-3" style={{ paddingTop: "calc(0.75rem + var(--safe-top))" }}>
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5" aria-label="KhauSafe home">
              <span className="text-[28px] font-black leading-none tracking-[-0.08em] text-[#171714]">khau</span>
              <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[#dfff55] ring-2 ring-[#171714]" />
            </Link>
            <div className="flex items-center gap-2">
              <label className="flex h-10 items-center rounded-full bg-white px-3 text-xs font-extrabold text-stone-800 shadow-[0_1px_0_rgba(0,0,0,.08)]">
                <span className="mr-1.5 text-[#ff5d2d]">●</span>
                <select value={filters.city} onChange={(event) => handleFilterChange({ ...filters, city: event.target.value, area: "all" })} aria-label="Choose city" className="max-w-[118px] appearance-none bg-transparent pr-3 outline-none">
                  {cities.map((city) => <option key={city} value={city}>{city}</option>)}
                </select>
                <span className="-ml-2 text-stone-400">⌄</span>
              </label>
              <Link href="/login" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#171714] text-xs font-black text-white" aria-label="Open account">KS</Link>
            </div>
          </div>
        </header>

        {mobileView === "discover" ? (
          <>
            <div className="z-20 shrink-0 px-5 pb-3">
              <div className="flex gap-2">
                <label className="flex h-12 min-w-0 flex-1 items-center gap-2 rounded-full bg-white px-4 shadow-[0_1px_0_rgba(0,0,0,.08)] focus-within:ring-2 focus-within:ring-[#171714]">
                  <span aria-hidden className="text-xl text-stone-900">⌕</span>
                  <input type="search" value={query} onChange={(event) => handleQueryChange(event.target.value)} placeholder="Find a stall or neighbourhood" aria-label="Search stalls, dishes or areas" className="min-w-0 flex-1 bg-transparent text-[14px] font-semibold text-stone-950 outline-none placeholder:font-medium placeholder:text-stone-400" />
                </label>
                <button type="button" onClick={() => setMobileFiltersOpen(true)} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#171714] text-lg text-white" aria-label="Open filters">☷</button>
              </div>
              <div className="scrollbar-none -mx-5 mt-3 flex gap-2 overflow-x-auto px-5 pb-1">
                {QUICK_CATEGORIES.map((item) => (
                  <button key={item.value} type="button" onClick={() => handleFilterChange({ ...filters, category: item.value })} aria-pressed={filters.category === item.value} className={`shrink-0 rounded-full px-4 py-2 text-[12px] font-extrabold transition ${filters.category === item.value ? "bg-[#dfff55] text-[#171714] ring-1 ring-[#171714]" : "bg-white text-stone-600"}`}>
                    {item.label}
                  </button>
                ))}
              </div>
              {locationError && <p role="status" className="mt-2 text-xs text-red-700">{locationError}</p>}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-8 pt-2">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-stone-500">Made for right now</p>
                  <h1 className="mt-1 text-[28px] font-black leading-none tracking-[-0.04em] text-[#171714]">Eat something good.</h1>
                </div>
                <span className="pb-0.5 text-xs font-bold text-stone-500">{cityLoading ? "Updating…" : `${sorted.length.toLocaleString()} spots`}</span>
              </div>

              {featuredVendor && (
                <Link href={`/vendors/${featuredVendor.id}`} className="group relative mt-5 block min-h-[238px] overflow-hidden rounded-[28px] bg-[radial-gradient(circle_at_80%_18%,#ffbd8a_0,transparent_24%),radial-gradient(circle_at_22%_90%,#dfff55_0,transparent_30%),linear-gradient(135deg,#ff5d2d,#ff8b45)] p-5 text-white shadow-[0_18px_40px_-24px_rgba(39,31,20,.6)] active:scale-[0.99]">
                  <div className="flex items-start justify-between">
                    <span className="rounded-full bg-black/80 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em]">Featured nearby</span>
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-lg text-black">↗</span>
                  </div>
                  <div className="absolute -right-4 top-12 rotate-[-8deg] text-[112px] drop-shadow-xl" aria-hidden>{QUICK_CATEGORIES.find((item) => item.value === featuredVendor.category)?.icon ?? "🍴"}</div>
                  <div className="absolute inset-x-5 bottom-5 max-w-[75%]">
                    <p className="text-xs font-bold text-white/80">{featuredVendor.area}</p>
                    <h2 className="mt-1 text-[27px] font-black leading-[1.02] tracking-[-0.035em]">{featuredVendor.name}</h2>
                    <p className="mt-2 text-xs font-semibold text-white/80">Publicly sourced · Tap for details</p>
                  </div>
                </Link>
              )}

              {popularVendors.length > 0 && query === "" && filters.category === "all" && (
                <section className="mt-7">
                  <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-black tracking-tight text-[#171714]">Popular around {filters.city}</h2><button type="button" onClick={() => setMobileView("map")} className="text-xs font-extrabold text-stone-500">See map</button></div>
                  <div className="scrollbar-none -mx-5 flex gap-3 overflow-x-auto px-5 pb-2">
                    {popularVendors.map((vendor, index) => (
                      <Link key={vendor.id} href={`/vendors/${vendor.id}`} className={`flex h-36 w-40 shrink-0 flex-col justify-between rounded-[22px] p-4 text-[#171714] ${index % 3 === 0 ? "bg-[#dfff55]" : index % 3 === 1 ? "bg-[#cdd8ff]" : "bg-[#ffd0be]"}`}>
                        <span className="text-3xl" aria-hidden>{QUICK_CATEGORIES.find((item) => item.value === vendor.category)?.icon ?? "🍴"}</span>
                        <div><p className="line-clamp-2 text-sm font-black leading-tight">{vendor.name}</p><p className="mt-1 line-clamp-1 text-[11px] font-bold opacity-60">{vendor.area}</p></div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              <section className="mt-7">
                <div className="mb-1 flex items-center justify-between"><h2 className="text-lg font-black tracking-tight text-[#171714]">All places</h2>{userLocation && <span className="text-[11px] font-bold text-stone-500">Nearest first</span>}</div>
                <p className="mb-4 text-xs leading-relaxed text-stone-500">Every place is source-linked. Hygiene certification only appears when individually verified.</p>
                {cityLoading && <p role="status" className="mb-3 rounded-2xl bg-white p-3 text-sm font-semibold text-stone-600">Loading more places in {filters.city}…</p>}
                {cityError && <p role="alert" className="mb-3 rounded-2xl bg-red-50 p-3 text-sm text-red-700">{cityError}</p>}
                <VendorList vendors={visibleVendors} distances={distances} ratings={ratings} />
                {visibleCount < sorted.length && <button type="button" onClick={() => setVisibleCount((count) => count + 24)} className="mt-4 h-13 w-full rounded-full bg-[#171714] text-sm font-black text-white">Show more places</button>}
              </section>
            </div>
          </>
        ) : (
          <div className="relative min-h-0 flex-1 isolate">
            <MapView vendors={mapVendors} fitVendors={mapVendors} userLocation={userLocation} />
            <div className="absolute inset-x-4 top-3 z-[1000] flex gap-2">
              <button type="button" onClick={() => setMobileView("discover")} className="flex h-12 flex-1 items-center gap-2 rounded-full bg-white/95 px-4 text-left text-sm font-bold text-stone-500 shadow-lg backdrop-blur">⌕ Search {filters.city}</button>
              <button type="button" onClick={handleLocate} disabled={locating} className="flex h-12 w-12 items-center justify-center rounded-full bg-[#171714] text-xl text-white shadow-lg" aria-label="Use my location">⌖</button>
            </div>
            <div className="pointer-events-none absolute inset-x-5 bottom-5 z-[1000] rounded-[22px] bg-[#171714]/95 px-4 py-3 text-center text-xs font-bold text-white shadow-xl backdrop-blur">Tap a marker to open the place · {mapVendors.length} neighbourhoods</div>
          </div>
        )}

        <nav aria-label="Explore views" className="z-20 grid shrink-0 grid-cols-4 border-t border-black/5 bg-[#fbfbf8]/95 px-3 pt-2 backdrop-blur-xl" style={{ paddingBottom: "max(0.5rem, var(--safe-bottom))" }}>
          <button type="button" onClick={() => setMobileView("discover")} aria-current={mobileView === "discover" ? "page" : undefined} className={`flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-2xl text-[10px] font-black ${mobileView === "discover" ? "text-[#171714]" : "text-stone-400"}`}><span className={`text-lg ${mobileView === "discover" ? "flex h-7 w-11 items-center justify-center rounded-full bg-[#dfff55]" : ""}`} aria-hidden>⌂</span>For you</button>
          <button type="button" onClick={() => setMobileView("map")} aria-current={mobileView === "map" ? "page" : undefined} className={`flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-2xl text-[10px] font-black ${mobileView === "map" ? "text-[#171714]" : "text-stone-400"}`}><span className={`text-lg ${mobileView === "map" ? "flex h-7 w-11 items-center justify-center rounded-full bg-[#dfff55]" : ""}`} aria-hidden>⌖</span>Explore</button>
          <button type="button" onClick={handleLocate} className="flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-2xl text-[10px] font-black text-stone-400"><span className="text-lg" aria-hidden>◎</span>Near me</button>
          <Link href="/login" className="flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-2xl text-[10px] font-black text-stone-400"><span className="text-lg" aria-hidden>◉</span>Account</Link>
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
            <div className="mt-6 flex gap-2"><button type="button" onClick={() => handleFilterChange({ ...filters, area: "all", category: "all", certifiedOnly: false })} className="h-12 flex-1 rounded-xl border border-stone-200 text-sm font-bold text-stone-800">Reset</button><button type="button" onClick={() => setMobileFiltersOpen(false)} className="h-12 flex-[2] rounded-xl bg-orange-600 text-sm font-bold text-white">Show {sorted.length.toLocaleString()} places</button></div>
          </section>
        </div>}
      </main>
    </div>
  );
}
