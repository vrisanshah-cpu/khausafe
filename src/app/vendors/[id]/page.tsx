import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CertificationBadge } from "@/components/CertificationBadge";
import { ShareButton } from "@/components/ShareButton";
import { VendorCommunity } from "@/components/VendorCommunity";
import { ZomatoButton } from "@/components/ZomatoButton";
import { CATEGORY_IMAGES } from "@/lib/categoryAssets";
import { CATEGORY_LABELS } from "@/lib/types";
import { getVendorById } from "@/lib/vendors";

export default async function VendorDetailPage(props: PageProps<"/vendors/[id]">) {
  const { id } = await props.params;
  const [vendor, cookieStore] = await Promise.all([getVendorById(id), cookies()]);
  if (!vendor) notFound();
  const isSignedIn = cookieStore.getAll().some(({ name }) =>
    /^sb-.*-auth-token(?:\.\d+)?$/.test(name)
  );
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${vendor.lat},${vendor.lng}`;

  return (
    <>
      <main className="mx-auto min-h-screen max-w-2xl bg-[#f7f7f7] pb-36">
        <div className="relative h-[270px] overflow-hidden bg-neutral-200 sm:h-[330px]">
          <Image
            src={CATEGORY_IMAGES[vendor.category]}
            alt=""
            width={720}
            height={720}
            priority
            sizes="(max-width: 672px) 100vw, 672px"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/20" />
          <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4" style={{ paddingTop: "calc(0.75rem + var(--safe-top))" }}>
            <Link href="/" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-xl font-medium text-neutral-900 shadow-md backdrop-blur" aria-label="Back to explore">←</Link>
            <ShareButton title={vendor.name} path={`/vendors/${vendor.id}`} />
          </div>
          <span className="absolute bottom-4 left-4 rounded-lg bg-black/65 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-white backdrop-blur">Category photo</span>
        </div>

        <div className="rounded-t-[28px] bg-white px-5 pb-6 pt-5 -mt-5 relative z-10">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#e23744]">{CATEGORY_LABELS[vendor.category]}</p>
              <h1 className="mt-1 text-[27px] font-extrabold leading-[1.08] tracking-[-0.035em] text-neutral-950">{vendor.name}</h1>
              <p className="mt-2 text-sm font-medium text-neutral-500">{vendor.area}</p>
            </div>
            <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="flex h-11 shrink-0 items-center gap-1.5 rounded-xl border border-neutral-200 px-3 text-xs font-bold text-neutral-800">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4 text-[#e23744]" aria-hidden><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" strokeLinejoin="round" /><circle cx="12" cy="10" r="2.5" /></svg>
              Map
            </a>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 border-y border-neutral-100 py-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-neutral-400">Listing source</p>
              <p className="mt-1 flex items-center gap-1.5 text-sm font-bold text-neutral-800"><span className="text-[#e23744]">✓</span> Publicly checked</p>
            </div>
            <div className="border-l border-neutral-100 pl-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-neutral-400">Hygiene status</p>
              <p className="mt-1 text-sm font-bold text-neutral-800">{vendor.certification_status === "unknown" ? "Not yet verified" : "Verified record"}</p>
            </div>
          </div>

          {vendor.certification_status !== "unknown" && (
            <div className="mt-4"><CertificationBadge status={vendor.certification_status} /></div>
          )}
        </div>

        <div className="space-y-4 px-4 pt-4 sm:px-5">
          <section className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-[0_4px_16px_rgba(28,28,28,.04)]">
            <div className="flex items-start gap-3">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${vendor.certification_status === "unknown" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden><path d="M12 3 20 6v5.5c0 4.6-3.2 7.8-8 9.5-4.8-1.7-8-4.9-8-9.5V6l8-3Z" strokeLinejoin="round" /><path d="M12 8v5M12 16.5h.01" strokeLinecap="round" /></svg>
              </span>
              <div>
                <h2 className="text-base font-extrabold text-neutral-950">Hygiene information</h2>
                <p className="mt-1 text-sm leading-relaxed text-neutral-600">
                  {vendor.certification_status === "unknown"
                    ? "We found this place in a public source, but have not found a vendor-level FSSAI hygiene certification for it. Community observations below are shown separately."
                    : "A vendor-level hygiene certification record is available for this place."}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-[0_4px_16px_rgba(28,28,28,.04)]">
            <h2 className="text-base font-extrabold text-neutral-950">About this listing</h2>
            <p className="mt-1 text-xs leading-relaxed text-neutral-500">Coordinates are manually placed from the named area and may not mark the exact cart or shop entrance.</p>
            <details className="mt-4 rounded-xl bg-[#f7f7f7] p-3.5">
              <summary className="cursor-pointer text-sm font-bold text-neutral-800">Read the source note</summary>
              <p className="mt-2 text-xs leading-relaxed text-neutral-600">{vendor.source}</p>
            </details>
          </section>

          <VendorCommunity vendorId={vendor.id} isSignedIn={isSignedIn} />
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-neutral-200 bg-white/95 px-4 pt-3 shadow-[0_-8px_24px_rgba(28,28,28,.06)] backdrop-blur-xl" style={{ paddingBottom: "calc(0.75rem + var(--safe-bottom))" }}>
        <div className="mx-auto max-w-2xl"><ZomatoButton vendor={vendor} /></div>
      </div>
    </>
  );
}
