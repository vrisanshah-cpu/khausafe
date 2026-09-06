import type { Vendor } from "@/lib/types";

export function ZomatoButton({ vendor }: { vendor: Vendor }) {
  const verified = Boolean(vendor.zomato_url);
  const href =
    vendor.zomato_url ??
    `https://www.zomato.com/mumbai/search?q=${encodeURIComponent(`${vendor.name} ${vendor.area}`)}`;

  return (
    <div>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex w-full items-center justify-center gap-1.5 rounded-full bg-red-600 py-2.5 text-sm font-semibold text-white shadow-sm transition-transform active:scale-[0.98]"
      >
        {verified ? "Order on Zomato" : "Search on Zomato"} <span aria-hidden>↗</span>
      </a>
      {!verified && (
        <p className="mt-1.5 truncate text-center text-[11px] text-neutral-400">
          No confirmed listing — opens a Zomato search instead.
        </p>
      )}
    </div>
  );
}
