import Image from "next/image";
import { CATEGORY_IMAGES } from "@/lib/categoryAssets";
import { formatDistance } from "@/lib/geo";
import {
  CATEGORY_LABELS,
  type DiscoveryVendor,
  type ReviewSummary,
} from "@/lib/types";
import { CertificationBadge } from "./CertificationBadge";

function ChevronIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden>
      <path d="m7.5 4.5 5.5 5.5-5.5 5.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SourceIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-3.5 w-3.5" aria-hidden>
      <path d="M10 2.5 16 5v4.4c0 3.6-2.4 6.4-6 8.1-3.6-1.7-6-4.5-6-8.1V5l6-2.5Z" strokeLinejoin="round" />
      <path d="m7.1 10 1.8 1.8 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function VendorList({
  vendors,
  distances,
  ratings,
}: {
  vendors: DiscoveryVendor[];
  distances?: Map<string, number>;
  ratings?: Map<string, ReviewSummary>;
}) {
  if (vendors.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-200 bg-white px-6 py-12 text-center">
        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#fff1f2] text-[#e23744]" aria-hidden>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" strokeLinecap="round" /></svg>
        </span>
        <p className="mt-3 text-sm font-bold text-neutral-800">No places found</p>
        <p className="mt-1 text-xs leading-relaxed text-neutral-500">Try another stall, food type, or neighbourhood.</p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3 md:p-3">
      {vendors.map((vendor) => {
        const distance = distances?.get(vendor.id);
        const rating = ratings?.get(vendor.id);
        const hasRating = Boolean(rating && rating.count > 0 && rating.average !== null);

        return (
          <li key={vendor.id}>
            <a
              href={`/vendors/${vendor.id}`}
              className="group flex min-h-[118px] gap-3 rounded-2xl border border-neutral-100 bg-white p-3 shadow-[0_4px_16px_rgba(28,28,28,.045)] transition-transform active:scale-[0.99]"
            >
              <span className="relative h-[104px] w-[112px] shrink-0 overflow-hidden rounded-xl bg-neutral-100 md:h-24 md:w-24">
                <Image
                  src={CATEGORY_IMAGES[vendor.category]}
                  alt=""
                  width={224}
                  height={208}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                />
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-2 pb-1.5 pt-5 text-[10px] font-bold text-white">
                  {CATEGORY_LABELS[vendor.category]}
                </span>
              </span>

              <span className="flex min-w-0 flex-1 flex-col py-0.5">
                <span className="flex items-start justify-between gap-2">
                  <span className="line-clamp-2 text-[15px] font-extrabold leading-[1.22] tracking-[-0.01em] text-neutral-950">{vendor.name}</span>
                  {hasRating && (
                    <span className="flex shrink-0 items-center gap-0.5 rounded-md bg-[#267e3e] px-1.5 py-1 text-[11px] font-extrabold text-white">
                      {rating!.average!.toFixed(1)} <span aria-hidden>★</span>
                    </span>
                  )}
                </span>
                <span className="mt-1 line-clamp-1 text-[12px] font-medium text-neutral-500">{vendor.area}</span>
                <span className="mt-auto flex items-end justify-between gap-2 pt-2">
                  <span className="flex min-w-0 items-center gap-1 text-[10px] font-semibold text-neutral-500">
                    <span className="text-[#e23744]"><SourceIcon /></span>
                    <span className="truncate">Public source checked</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1 text-[11px] font-bold text-neutral-700">
                    {distance !== undefined ? formatDistance(distance) : "Details"}
                    <ChevronIcon />
                  </span>
                </span>
                <span className="mt-1.5 flex flex-wrap gap-1.5">
                  {vendor.certification_status !== "unknown" && <CertificationBadge status={vendor.certification_status} />}
                  {vendor.is_sponsored && (
                    <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-700">Sponsored</span>
                  )}
                </span>
              </span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
