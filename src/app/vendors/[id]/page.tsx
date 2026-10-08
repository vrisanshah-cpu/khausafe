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
      <main className="mx-auto max-w-2xl pb-28">
        <div className="bg-gradient-to-b from-orange-50 to-white px-4 pt-4 pb-5">
          <Link href="/" className="text-sm font-medium text-orange-700 hover:underline">
            ← Back to places
          </Link>

          <div className="mt-3 flex items-start gap-3">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl shadow-[var(--shadow-card)]">
              {CATEGORY_EMOJI[vendor.category]}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <h1 className="text-xl font-bold leading-tight text-neutral-900">{vendor.name}</h1>
                <ShareButton title={vendor.name} path={`/vendors/${vendor.id}`} />
              </div>
              <p className="mt-0.5 text-sm text-neutral-500">
                {vendor.area} &middot; {CATEGORY_LABELS[vendor.category]}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {vendor.certification_status !== "unknown" && (
                  <CertificationBadge status={vendor.certification_status} />
                )}
                {vendor.is_sponsored && (
                  <span className="rounded-full border border-amber-300 bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                    ★ Sponsored
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 px-4">
          <section className="card p-4">
            <h2 className="text-xs font-bold uppercase tracking-wide text-neutral-400">
              What we know
            </h2>
            <p className="mt-2 text-sm font-medium text-neutral-700">
              {vendor.certification_status === "unknown"
                ? "This place is publicly listed, but its hygiene and licence status have not been independently verified."
                : <CertificationBadge status={vendor.certification_status} />}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-neutral-500">{vendor.source}</p>
          </section>

          <VendorCommunity vendorId={vendor.id} isSignedIn={isSignedIn} />
        </div>
      </main>

      <div
        className="fixed inset-x-0 bottom-0 z-30 border-t border-neutral-200 bg-white/95 px-4 pt-3 backdrop-blur-sm"
        style={{ paddingBottom: "calc(0.75rem + var(--safe-bottom))" }}
      >
        <div className="mx-auto max-w-2xl">
          <ZomatoButton vendor={vendor} />
        </div>
      </div>
    </>
  );
}
