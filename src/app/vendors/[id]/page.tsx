import { notFound } from "next/navigation";
import Link from "next/link";
import { CATEGORY_LABELS, type VendorCategory } from "@/lib/types";
import { getVendorById } from "@/lib/vendors";
import { getObservationsForVendor, summarizeObservations } from "@/lib/observations";
import { getReviewsForVendor, summarizeReviews } from "@/lib/reviews";
import { createClient } from "@/lib/supabase/server";
import { CertificationBadge } from "@/components/CertificationBadge";
import { ObservationForm } from "@/components/ObservationForm";
import { ShareButton } from "@/components/ShareButton";
import { ReviewForm } from "@/components/ReviewForm";
import { ReviewsList } from "@/components/ReviewsList";
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
  const vendor = await getVendorById(id);
  if (!vendor) notFound();

  const [observations, reviews] = await Promise.all([
    getObservationsForVendor(vendor.id),
    getReviewsForVendor(vendor.id),
  ]);
  const summary = summarizeObservations(observations);
  const reviewSummary = summarizeReviews(reviews);

  const supabase = await createClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;

  return (
    <>
      <main className="mx-auto max-w-2xl pb-28">
        <div className="bg-gradient-to-b from-orange-50 to-white px-4 pt-4 pb-5">
          <Link href="/" className="text-sm font-medium text-orange-700 hover:underline">
            ← Back to map
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
                <CertificationBadge status={vendor.certification_status} />
                {vendor.is_sponsored && (
                  <span className="rounded-full border border-amber-300 bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                    ★ Sponsored
                  </span>
                )}
                {reviewSummary.count > 0 && (
                  <span className="text-sm text-neutral-600">
                    <span className="font-semibold text-amber-600">★ {reviewSummary.average!.toFixed(1)}</span>{" "}
                    ({reviewSummary.count})
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 px-4">
          <section className="card p-4">
            <h2 className="text-xs font-bold uppercase tracking-wide text-neutral-400">
              Official certification
            </h2>
            <div className="mt-2">
              <CertificationBadge status={vendor.certification_status} />
            </div>
            <p className="mt-2 text-xs leading-relaxed text-neutral-500">{vendor.source}</p>
          </section>

          <section className="card p-4">
            <h2 className="text-xs font-bold uppercase tracking-wide text-neutral-400">
              Community observed
            </h2>
            <p className="mt-1 text-xs text-neutral-400">
              Submitted by app users, not an official rating — shown separately from certification
              on purpose.
            </p>

            {summary.count === 0 ? (
              <p className="mt-3 text-sm text-neutral-500">No community observations yet.</p>
            ) : (
              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-neutral-500">Clean prep surface</dt>
                  <dd className="font-semibold text-neutral-900">{summary.cleanPrepPct}%</dd>
                </div>
                <div>
                  <dt className="text-neutral-500">Gloves/utensils used</dt>
                  <dd className="font-semibold text-neutral-900">{summary.glovesPct}%</dd>
                </div>
                <div>
                  <dt className="text-neutral-500">Covered food storage</dt>
                  <dd className="font-semibold text-neutral-900">{summary.coveredStoragePct}%</dd>
                </div>
                <div>
                  <dt className="text-neutral-500">Clean water access</dt>
                  <dd className="font-semibold text-neutral-900">{summary.cleanWaterPct}%</dd>
                </div>
                <div className="col-span-2 text-xs text-neutral-400">
                  Based on {summary.count} observation{summary.count === 1 ? "" : "s"}.
                </div>
              </dl>
            )}

            <div className="mt-4 border-t border-neutral-100 pt-4">
              <h3 className="text-sm font-semibold text-neutral-800">Submit an observation</h3>
              <div className="mt-2">
                <ObservationForm vendorId={vendor.id} isSignedIn={Boolean(user)} />
              </div>
            </div>
          </section>

          <section className="card p-4">
            <h2 className="text-xs font-bold uppercase tracking-wide text-neutral-400">Reviews</h2>
            <p className="mt-1 text-xs text-neutral-400">
              Star ratings and comments from app users. Reviews that get reported by several
              different people are automatically taken down pending review — this isn&apos;t part
              of the official certification either.
            </p>

            <div className="mt-3">
              <ReviewsList reviews={reviews} isSignedIn={Boolean(user)} />
            </div>

            <div className="mt-4 border-t border-neutral-100 pt-4">
              <h3 className="text-sm font-semibold text-neutral-800">Leave a review</h3>
              <div className="mt-2">
                <ReviewForm vendorId={vendor.id} isSignedIn={Boolean(user)} />
              </div>
            </div>
          </section>
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
