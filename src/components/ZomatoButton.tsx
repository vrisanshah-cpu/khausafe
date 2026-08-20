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
        className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
      >
        {verified ? "Order on Zomato" : "Search on Zomato"} <span aria-hidden>↗</span>
      </a>
      {!verified && (
        <p className="mt-1 text-xs text-neutral-400">
          No confirmed Zomato listing for this stall yet — this opens a Zomato search instead.
          Many informal street stalls aren&apos;t listed on delivery apps at all.
        </p>
      )}
    </div>
  );
}
