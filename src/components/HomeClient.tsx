"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { getPopularAreas } from "@/lib/areas";
import { CATEGORY_IMAGES } from "@/lib/categoryAssets";
import { getNearestPrimaryCity } from "@/lib/cities";
import { distanceKm } from "@/lib/geo";
import {
  cacheDiscoveryPreferences,
  cacheVendors,
  getCachedDiscoveryPreferences,
} from "@/lib/offline/vendorCache";
import {
  CATEGORY_LABELS,
  type DiscoveryVendor,
  type ReviewSummary,
  type VendorCategory,
} from "@/lib/types";
import { BrandMark } from "./BrandMark";
import { FilterBar, type Filters } from "./FilterBar";
import { TopPicksStrip } from "./TopPicksStrip";
import { VendorList } from "./VendorList";

const MapView = dynamic(() => import("./MapView").then((mod) => mod.MapView), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-[#f7f7f7] text-sm text-neutral-500">
      Loading map…
    </div>
  ),
});

const QUICK_CATEGORIES: { value: VendorCategory | "all"; label: string; image: string }[] = [
  { value: "all", label: "All", image: CATEGORY_IMAGES.other },
  { value: "chaat", label: "Chaat", image: CATEGORY_IMAGES.chaat },
  { value: "snacks", label: "Snacks", image: CATEGORY_IMAGES.snacks },
  { value: "sweets", label: "Sweets", image: CATEGORY_IMAGES.sweets },
  { value: "beverages", label: "Chai", image: CATEGORY_IMAGES.beverages },
  { value: "juice", label: "Juice", image: CATEGORY_IMAGES.juice },
];

const POPULAR_SEARCHES = ["Pani puri", "Momos", "Chaat", "Mithai", "Chai"];

function SearchIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" strokeLinecap="round" />
    </svg>
  );
}

function PinIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className={className} aria-hidden>
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" strokeLinejoin="round" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function SlidersIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className={className} aria-hidden>
      <path d="M4 7h10M18 7h2M4 17h2M10 17h10M14 4v6M8 14v6" strokeLinecap="round" />
    </svg>
  );
}

function MapIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden>
      <path d="m3.5 6.5 5-2.5 7 2.5 5-2.5v14l-5 2.5-7-2.5-5 2.5v-14Z" strokeLinejoin="round" />
      <path d="M8.5 4v14M15.5 6.5v14" />
    </svg>
  );
}

function HomeIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className={className} aria-hidden>
      <path d="m3 11 9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9Z" strokeLinejoin="round" />
    </svg>
  );
}

function UserIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className={className} aria-hidden>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 21a7.5 7.5 0 0 1 15 0" strokeLinecap="round" />
    </svg>
  );
}

function LoadingCards() {
  return (
    <div className="space-y-4" aria-label="Loading places">
      {[0, 1, 2].map((item) => (
        <div key={item} className="flex animate-pulse gap-3 rounded-2xl border border-neutral-100 bg-white p-3">
          <div className="h-24 w-28 shrink-0 rounded-xl bg-neutral-100" />
          <div className="flex-1 py-1">
            <div className="h-4 w-3/4 rounded bg-neutral-100" />
            <div className="mt-3 h-3 w-1/2 rounded bg-neutral-100" />
            <div className="mt-5 h-3 w-2/3 rounded bg-neutral-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function HomeClient({
  initialVendors,
  initialRatings,
  cities,
}: {
  initialVendors: DiscoveryVendor[];
  initialRatings: Map<string, ReviewSummary>;
  cities: string[];
}) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [vendors, setVendors] = useState(initialVendors);
  const [ratings, setRatings] = useState(initialRatings);
  const [loadedCity, setLoadedCity] = useState("Mumbai");
  const [catalogComplete, setCatalogComplete] = useState(false);
  const [cityLoadError, setCityLoadError] = useState<{ city: string; message: string } | null>(null);
  const [visibleCount, setVisibleCount] = useState(24);
  const [isDesktop, setIsDesktop] = useState(false);
  const [mobileView, setMobileView] = useState<"discover" | "map">("discover");
  const [searchActive, setSearchActive] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [sortMode, setSortMode] = useState<"default" | "nearest" | "rating">("default");
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
  const cityLoading = filters.city !== loadedCity && cityError === null;
  const cityVendors = useMemo(
    () => (filters.city === loadedCity ? vendors : []),
    [filters.city, loadedCity, vendors]
  );
  const areas = useMemo(() => getPopularAreas(cityVendors), [cityVendors]);
  const hasRatings = useMemo(
    () => Array.from(ratings.values()).some((rating) => rating.count > 0 && rating.average !== null),
    [ratings]
  );

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
      setLocationError("Location isn’t available in this browser.");
      return;
    }
    setLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(location);
        setSortMode("nearest");
        const nearestCity = getNearestPrimaryCity(location);
        if (nearestCity) {
          setFilters((current) => ({ ...current, city: nearestCity, area: "all" }));
          setVisibleCount(24);
        }
        setLocating(false);
      },
      (err) => {
        setLocationError(
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied — enable it to sort nearby stalls."
            : "Couldn’t get your location."
        );
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return cityVendors.filter((vendor) => {
      const searchable = `${vendor.name} ${vendor.area} ${CATEGORY_LABELS[vendor.category]}`.toLowerCase();
      return (
        (filters.area === "all" || vendor.area === filters.area) &&
        (filters.category === "all" || vendor.category === filters.category) &&
        (q === "" ||
          searchable.includes(q) ||
          (q === "mithai" && vendor.category === "sweets") ||
          (q === "chai" && vendor.category === "beverages"))
      );
    });
  }, [cityVendors, filters, query]);

  const distances = useMemo(() => {
    if (!userLocation) return undefined;
    const map = new Map<string, number>();
    for (const vendor of cityVendors) map.set(vendor.id, distanceKm(userLocation, vendor));
    return map;
  }, [cityVendors, userLocation]);

  const sorted = useMemo(() => {
    if (sortMode === "rating") {
      return [...filtered].sort((a, b) => {
        const aRating = ratings.get(a.id);
        const bRating = ratings.get(b.id);
        return (bRating?.average ?? -1) - (aRating?.average ?? -1) || (bRating?.count ?? 0) - (aRating?.count ?? 0);
      });
    }
    if (sortMode === "nearest" && distances) {
      return [...filtered].sort((a, b) => (distances.get(a.id) ?? Infinity) - (distances.get(b.id) ?? Infinity));
    }
    return filtered;
  }, [filtered, distances, ratings, sortMode]);

  const visibleVendors = useMemo(() => sorted.slice(0, visibleCount), [sorted, visibleCount]);
  const mapVendors = useMemo(() => {
    const cells = new Set<string>();
    const pins: DiscoveryVendor[] = [];
    for (const vendor of sorted) {
      const cell = `${Math.round(vendor.lat / 0.006)}:${Math.round(vendor.lng / 0.006)}`;
      if (cells.has(cell)) continue;
      cells.add(cell);
      pins.push(vendor);
      if (pins.length === 50) break;
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
    setMobileView("discover");
  }

  function startSearch(term?: string) {
    setMobileView("discover");
    setSearchActive(true);
    if (term !== undefined) handleQueryChange(term);
    requestAnimationFrame(() => searchInputRef.current?.focus());
  }

  function resetDiscovery() {
    setQuery("");
    setSearchActive(false);
    setSortMode("default");
    handleFilterChange({ ...filters, area: "all", category: "all", certifiedOnly: false });
  }

  const showTopPicks = query === "" && filters.area === "all" && filters.category === "all";

  return (
    <div className="flex h-[100dvh] min-h-0 flex-col bg-white md:h-[calc(100dvh-3.5rem-var(--safe-top))] md:flex-row">
      <aside className="hidden w-[390px] shrink-0 flex-col border-r border-neutral-200 bg-white md:flex">
        <div className="border-b border-neutral-100 px-3 pt-3">
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
        <div className="flex-1 overflow-y-auto bg-[#fafafa]">
          {cityLoading && <p className="px-4 py-3 text-sm text-neutral-500">Loading {filters.city}…</p>}
          {cityError && <p className="px-4 py-3 text-sm text-red-600">{cityError}</p>}
          <VendorList vendors={visibleVendors} distances={distances} ratings={ratings} />
          {visibleCount < sorted.length && (
            <button type="button" onClick={() => setVisibleCount((count) => count + 50)} className="btn-secondary mx-3 mb-4 w-[calc(100%-1.5rem)]">
              Show more ({sorted.length - visibleCount} remaining)
            </button>
          )}
        </div>
      </aside>

      {isDesktop && (
        <div className="hidden min-h-0 flex-1 isolate md:block">
          <MapView vendors={mapVendors} fitVendors={mapVendors} userLocation={userLocation} />
        </div>
      )}

      <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-white md:hidden">
        <header className="z-30 shrink-0 border-b border-neutral-100 bg-white px-4 pb-3" style={{ paddingTop: "calc(0.65rem + var(--safe-top))" }}>
          <div className="flex min-h-11 items-center gap-3">
            <BrandMark size={40} />
            <label className="relative min-w-0 flex-1 cursor-pointer">
              <span className="flex items-center gap-1 text-[15px] font-extrabold leading-tight text-neutral-950">
                {filters.city}
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-[#e23744]" aria-hidden><path d="m5.7 7.5 4.3 4.3 4.3-4.3 1.4 1.4-5.7 5.7-5.7-5.7 1.4-1.4Z" /></svg>
              </span>
              <span className="block truncate text-[11px] font-medium text-neutral-500">
                {filters.area === "all" ? "Choose an area or use your location" : filters.area}
              </span>
              <select
                value={filters.city}
                onChange={(event) => handleFilterChange({ ...filters, city: event.target.value, area: "all" })}
                aria-label="Choose city"
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              >
                {cities.map((city) => <option key={city} value={city}>{city}</option>)}
              </select>
            </label>
            <Link href="/login" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f3f3f3] text-neutral-700" aria-label="Open account">
              <UserIcon className="h-5 w-5" />
            </Link>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <label className="flex h-[52px] min-w-0 flex-1 items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-4 shadow-[0_3px_14px_rgba(28,28,28,.08)] focus-within:border-[#e23744] focus-within:ring-2 focus-within:ring-[#e23744]/10">
              <SearchIcon className="h-5 w-5 shrink-0 text-[#e23744]" />
              <input
                ref={searchInputRef}
                type="search"
                value={query}
                onFocus={() => { setSearchActive(true); setMobileView("discover"); }}
                onChange={(event) => handleQueryChange(event.target.value)}
                placeholder="Search for stall, food or area"
                aria-label="Search for stall, food or area"
                className="min-w-0 flex-1 bg-transparent text-[15px] font-medium text-neutral-950 outline-none placeholder:text-neutral-400"
              />
              {query && (
                <button type="button" onClick={() => handleQueryChange("")} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-sm text-neutral-600" aria-label="Clear search">×</button>
              )}
            </label>
            {searchActive ? (
              <button type="button" onClick={() => setSearchActive(false)} className="h-11 shrink-0 px-1 text-sm font-bold text-[#e23744]">Cancel</button>
            ) : (
              <button type="button" onClick={() => setMobileFiltersOpen(true)} className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl border border-neutral-200 bg-white text-neutral-800 shadow-[0_3px_14px_rgba(28,28,28,.06)]" aria-label="Open filters">
                <SlidersIcon />
              </button>
            )}
          </div>
        </header>

        {mobileView === "map" ? (
          <div className="relative min-h-0 flex-1 isolate">
            <MapView vendors={mapVendors} fitVendors={mapVendors} userLocation={userLocation} />
            <div className="absolute left-4 top-3 z-[1000] rounded-full bg-white/95 px-3 py-2 text-xs font-bold text-neutral-700 shadow-md backdrop-blur">{mapVendors.length} mapped areas</div>
            <button type="button" onClick={handleLocate} disabled={locating} className="absolute bottom-5 right-4 z-[1000] flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#e23744] shadow-lg disabled:opacity-60" aria-label="Use my location">
              <PinIcon />
            </button>
          </div>
        ) : searchActive ? (
          <section className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-white px-4 pb-8 pt-5">
            {query.trim() === "" ? (
              <>
                <h1 className="text-xl font-extrabold tracking-tight text-neutral-950">What are you craving?</h1>
                <p className="mt-1 text-sm text-neutral-500">Search across {filters.city} by stall, food type or neighbourhood.</p>
                <div className="mt-6">
                  <h2 className="text-xs font-extrabold uppercase tracking-[0.14em] text-neutral-400">Popular searches</h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {POPULAR_SEARCHES.map((term) => (
                      <button key={term} type="button" onClick={() => startSearch(term)} className="rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 shadow-sm">
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mt-8">
                  <h2 className="text-xs font-extrabold uppercase tracking-[0.14em] text-neutral-400">Browse food types</h2>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    {QUICK_CATEGORIES.slice(1).map((item) => (
                      <button key={item.value} type="button" onClick={() => { handleFilterChange({ ...filters, category: item.value }); setSearchActive(false); }} className="flex items-center gap-3 rounded-2xl border border-neutral-100 bg-[#fafafa] p-2.5 text-left">
                        <Image src={item.image} alt="" width={48} height={48} className="h-12 w-12 rounded-xl object-cover" />
                        <span className="text-sm font-bold text-neutral-900">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="mb-4 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-neutral-500">Search results</p>
                    <h1 className="mt-0.5 text-lg font-extrabold text-neutral-950">“{query.trim()}”</h1>
                  </div>
                  <span className="text-xs font-semibold text-neutral-500">{sorted.length.toLocaleString()} found</span>
                </div>
                {cityLoading ? <LoadingCards /> : <VendorList vendors={visibleVendors} distances={distances} ratings={ratings} />}
                {visibleCount < sorted.length && (
                  <button type="button" onClick={() => setVisibleCount((count) => count + 24)} className="mt-4 h-12 w-full rounded-xl border border-neutral-200 text-sm font-bold text-neutral-800">Show more results</button>
                )}
              </>
            )}
          </section>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[#fafafa] pb-8">
            <section className="bg-white px-4 pb-5 pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#e23744]">Discover nearby</p>
                  <h1 className="mt-1 text-[23px] font-extrabold tracking-[-0.025em] text-neutral-950">What are you craving?</h1>
                </div>
                <button type="button" onClick={handleLocate} disabled={locating} className="flex h-10 items-center gap-1.5 rounded-full bg-[#fff1f2] px-3 text-xs font-bold text-[#d92d3c] disabled:opacity-60">
                  <PinIcon className="h-4 w-4" /> {locating ? "Locating…" : "Near me"}
                </button>
              </div>
              <div className="scrollbar-none -mx-4 mt-5 flex gap-4 overflow-x-auto px-4 pb-1">
                {QUICK_CATEGORIES.map((item) => (
                  <button key={item.value} type="button" onClick={() => handleFilterChange({ ...filters, category: item.value })} aria-pressed={filters.category === item.value} className="flex w-[66px] shrink-0 flex-col items-center gap-2">
                    <span className={`block h-[62px] w-[62px] overflow-hidden rounded-full bg-neutral-100 p-0.5 transition ${filters.category === item.value ? "ring-2 ring-[#e23744] ring-offset-2" : "ring-1 ring-neutral-100"}`}>
                      <Image src={item.image} alt="" width={62} height={62} priority={item.value === "all"} className="h-full w-full rounded-full object-cover" />
                    </span>
                    <span className={`text-[12px] font-bold ${filters.category === item.value ? "text-[#e23744]" : "text-neutral-700"}`}>{item.label}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="border-y border-neutral-100 bg-white py-3">
              <div className="scrollbar-none flex gap-2 overflow-x-auto px-4">
                <button type="button" onClick={handleLocate} className={`flex h-9 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-xs font-bold ${sortMode === "nearest" ? "border-[#e23744] bg-[#fff1f2] text-[#d92d3c]" : "border-neutral-200 bg-white text-neutral-700"}`}>
                  <PinIcon className="h-3.5 w-3.5" /> Nearest
                </button>
                {hasRatings && (
                  <button type="button" onClick={() => setSortMode(sortMode === "rating" ? "default" : "rating")} className={`h-9 shrink-0 rounded-lg border px-3 text-xs font-bold ${sortMode === "rating" ? "border-[#e23744] bg-[#fff1f2] text-[#d92d3c]" : "border-neutral-200 bg-white text-neutral-700"}`}>Top rated</button>
                )}
                <button type="button" onClick={() => setMobileFiltersOpen(true)} className={`h-9 shrink-0 rounded-lg border px-3 text-xs font-bold ${filters.area !== "all" ? "border-[#e23744] bg-[#fff1f2] text-[#d92d3c]" : "border-neutral-200 bg-white text-neutral-700"}`}>
                  {filters.area === "all" ? "Neighbourhood" : filters.area}
                </button>
                {(filters.area !== "all" || filters.category !== "all" || query || sortMode !== "default") && (
                  <button type="button" onClick={resetDiscovery} className="h-9 shrink-0 px-2 text-xs font-bold text-[#d92d3c]">Clear all</button>
                )}
              </div>
            </section>

            <section className="px-4 pb-4 pt-5">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <h2 className="text-[19px] font-extrabold tracking-[-0.02em] text-neutral-950">Places around you</h2>
                  <p className="mt-0.5 text-xs text-neutral-500">Publicly sourced listings in {filters.city}</p>
                </div>
                <span className="pb-0.5 text-xs font-semibold text-neutral-500">{cityLoading ? "Updating…" : `${sorted.length.toLocaleString()} places`}</span>
              </div>
              <div className="mt-4">
                {cityLoading ? <LoadingCards /> : <VendorList vendors={visibleVendors} distances={distances} ratings={ratings} />}
                {cityError && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{cityError}</p>}
                {locationError && <p role="status" className="mt-3 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">{locationError}</p>}
              </div>
              {visibleCount < sorted.length && (
                <button type="button" onClick={() => setVisibleCount((count) => count + 24)} className="mt-4 h-12 w-full rounded-xl border border-[#e23744] bg-white text-sm font-bold text-[#d92d3c] active:bg-[#fff1f2]">Show more places</button>
              )}
            </section>
          </div>
        )}

        {!searchActive && (
          <nav aria-label="Primary navigation" className="z-30 grid shrink-0 grid-cols-4 border-t border-neutral-200 bg-white/95 px-3 pt-1.5 backdrop-blur-xl" style={{ paddingBottom: "max(0.45rem, var(--safe-bottom))" }}>
            <button type="button" onClick={() => { setMobileView("discover"); setSearchActive(false); }} className={`flex min-h-13 flex-col items-center justify-center gap-0.5 text-[10px] font-bold ${mobileView === "discover" ? "text-[#e23744]" : "text-neutral-500"}`}>
              <HomeIcon className="h-5 w-5" /> Explore
            </button>
            <button type="button" onClick={() => startSearch()} className="flex min-h-13 flex-col items-center justify-center gap-0.5 text-[10px] font-bold text-neutral-500">
              <SearchIcon className="h-5 w-5" /> Search
            </button>
            <button type="button" onClick={() => setMobileView("map")} className={`flex min-h-13 flex-col items-center justify-center gap-0.5 text-[10px] font-bold ${mobileView === "map" ? "text-[#e23744]" : "text-neutral-500"}`}>
              <MapIcon className="h-5 w-5" /> Map
            </button>
            <Link href="/login" className="flex min-h-13 flex-col items-center justify-center gap-0.5 text-[10px] font-bold text-neutral-500">
              <UserIcon className="h-5 w-5" /> Account
            </Link>
          </nav>
        )}

        {mobileFiltersOpen && (
          <div className="absolute inset-0 z-50 flex items-end bg-neutral-950/45" onClick={() => setMobileFiltersOpen(false)}>
            <section role="dialog" aria-modal="true" aria-label="Filter places" onClick={(event) => event.stopPropagation()} className="max-h-[88dvh] w-full overflow-y-auto rounded-t-[28px] bg-white p-5 shadow-2xl" style={{ paddingBottom: "max(1.5rem, var(--safe-bottom))" }}>
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-neutral-300" />
              <div className="flex items-center justify-between">
                <div><h2 className="text-xl font-extrabold text-neutral-950">Filters</h2><p className="mt-0.5 text-xs text-neutral-500">Refine places in {filters.city}</p></div>
                <button type="button" onClick={() => setMobileFiltersOpen(false)} aria-label="Close filters" className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-xl text-neutral-600">×</button>
              </div>
              <p className="mt-6 text-xs font-extrabold uppercase tracking-[0.12em] text-neutral-400">Food type</p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {QUICK_CATEGORIES.map((item) => (
                  <button key={item.value} type="button" onClick={() => handleFilterChange({ ...filters, category: item.value })} className={`rounded-xl border px-2 py-2.5 text-xs font-bold ${filters.category === item.value ? "border-[#e23744] bg-[#fff1f2] text-[#d92d3c]" : "border-neutral-200 text-neutral-700"}`}>{item.label}</button>
                ))}
              </div>
              <label className="mt-6 block text-xs font-extrabold uppercase tracking-[0.12em] text-neutral-400">
                Neighbourhood
                <select value={filters.area} onChange={(event) => handleFilterChange({ ...filters, area: event.target.value })} className="mt-2 h-12 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm font-semibold normal-case tracking-normal text-neutral-900 outline-none focus:border-[#e23744]">
                  <option value="all">All neighbourhoods</option>
                  {filters.area !== "all" && !areas.includes(filters.area) && <option value={filters.area}>{filters.area}</option>}
                  {areas.map((area) => <option key={area} value={area}>{area}</option>)}
                </select>
              </label>
              <div className="mt-6 flex gap-2">
                <button type="button" onClick={resetDiscovery} className="h-12 flex-1 rounded-xl border border-neutral-200 text-sm font-bold text-neutral-800">Reset</button>
                <button type="button" onClick={() => setMobileFiltersOpen(false)} className="h-12 flex-[2] rounded-xl bg-[#e23744] text-sm font-bold text-white">Show {sorted.length.toLocaleString()} places</button>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
