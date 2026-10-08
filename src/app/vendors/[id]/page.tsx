import { notFound } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import { CATEGORY_LABELS, type VendorCategory } from "@/lib/types";
import { getVendorById } from "@/lib/vendors";
import { CertificationBadge } from "@/components/CertificationBadge";
import { ShareButton } from "@/components/ShareButton";
import { VendorCommunity } from "@/components/VendorCommunity";
import { ZomatoButton } from "@/components/ZomatoButton";

const CATEGORY_EMOJI: Record<VendorCategory, string> = {
  chaat: "🌶️",
  juice: "🥤",
  snacks: "🍟",
  sweets: "🍬",
  beverages: "☕",
  other: "🍴",
};

export default async function VendorDetailPage(props: PageProps<"/vendors/[id]">) {
  const { id } = await props.params;
  const [vendor, cookieStore] = await Promise.all([
    getVendorById(id),
    cookies(),
  ]);
  if (!vendor) notFound();
  const isSignedIn = cookieStore.getAll().some(({ name }) =>
    /^sb-.*-auth-token(?:\.\d+)?$/.test(name)
  );

  return (
    <>
      <main className="mx-auto min-h-screen max-w-2xl bg-[#f4f4ef] pb-32">
        <div className="rounded-b-[34px] bg-[#171714] px-5 pb-6 text-white" style={{ paddingTop: "calc(0.75rem + var(--safe-top))" }}>
          <div className="flex items-center justify-between">
            <Link href="/" className="flex h-10 items-center gap-2 rounded-full bg-white/10 px-3 text-xs font-extrabold text-white backdrop-blur">
              ← Explore
            </Link>
            <ShareButton title={vendor.name} path={`/vendors/${vendor.id}`} />
          </div>

          <div className="relative mt-4 flex h-48 items-center justify-center overflow-hidden rounded-[26px] bg-[radial-gradient(circle_at_20%_20%,#dfff55_0,transparent_28%),radial-gradient(circle_at_85%_85%,#ffb48f_0,transparent_28%),linear-gradient(135deg,#ff5d2d,#ff8e45)]">
            <span className="rotate-[-8deg] text-[108px] drop-shadow-2xl" aria-hidden>{CATEGORY_EMOJI[vendor.category]}</span>
            <span className="absolute left-4 top-4 rounded-full bg-black/75 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.13em]">{CATEGORY_LABELS[vendor.category]}</span>
          </div>

          <div className="mt-5">
            <p className="text-xs font-bold text-white/55">{vendor.area}</p>
            <h1 className="mt-1 text-[30px] font-black leading-[1.02] tracking-[-0.04em]">{vendor.name}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#dfff55] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.1em] text-[#171714]">Source checked</span>
              {vendor.certification_status !== "unknown" && <CertificationBadge status={vendor.certification_status} />}
              {vendor.is_sponsored && <span className="rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.1em]">Sponsored</span>}
            </div>
          </div>
        </div>

        <div className="space-y-4 px-5 pt-5">
          <section className="rounded-[24px] bg-white p-5 shadow-[0_12px_30px_-28px_rgba(20,20,15,.7)]">
            <div className="flex items-center justify-between">
              <h2 className="text-[11px] font-black uppercase tracking-[0.16em] text-neutral-400">What we know</h2>
              <span className="h-2.5 w-2.5 rounded-full bg-[#dfff55] ring-2 ring-[#171714]" />
            </div>
            <p className="mt-3 text-sm font-bold leading-relaxed text-neutral-800">
              {vendor.certification_status === "unknown"
                ? "This place is publicly listed, but its hygiene and licence status have not been independently verified."
                : <CertificationBadge status={vendor.certification_status} />}
            </p>
            <details className="mt-3 rounded-2xl bg-[#f4f4ef] p-3">
              <summary className="cursor-pointer text-xs font-extrabold text-stone-600">View source and location note</summary>
              <p className="mt-2 text-xs leading-relaxed text-neutral-500">{vendor.source}</p>
            </details>
          </section>

          <VendorCommunity vendorId={vendor.id} isSignedIn={isSignedIn} />
        </div>
      </main>

      <div
        className="fixed inset-x-0 bottom-0 z-30 border-t border-black/5 bg-[#fbfbf8]/95 px-5 pt-3 backdrop-blur-xl"
        style={{ paddingBottom: "calc(0.75rem + var(--safe-bottom))" }}
      >
        <div className="mx-auto max-w-2xl">
          <ZomatoButton vendor={vendor} />
        </div>
      </div>
    </>
  );
}
