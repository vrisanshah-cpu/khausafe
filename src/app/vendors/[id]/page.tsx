import { notFound } from "next/navigation";
import Link from "next/link";
import { CATEGORY_LABELS } from "@/lib/types";
import { getVendorById } from "@/lib/vendors";
import { getObservationsForVendor, summarizeObservations } from "@/lib/observations";
import { getReviewsForVendor, summarizeReviews } from "@/lib/reviews";
import { createClient } from "@/lib/supabase/server";
import { CertificationBadge } from "@/components/CertificationBadge";
import { ObservationForm } from "@/components/ObservationForm";
import { ReviewForm } from "@/components/ReviewForm";
import { ReviewsList } from "@/components/ReviewsList";
import { ZomatoButton } from "@/components/ZomatoButton";

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
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/" className="text-sm text-orange-700 hover:underline">
        ← Back to map
      </Link>

      <div className="mt-3 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">{vendor.name}</h1>
          <p className="text-sm text-neutral-500">
            {vendor.area} &middot; {CATEGORY_LABELS[vendor.category]}
          </p>
        </div>
        {vendor.is_sponsored && (
          <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800 border border-amber-300">
            ★ Sponsored
          </span>
        )}
      </div>

      {reviewSummary.count > 0 && (
        <p className="mt-1 text-sm text-neutral-600">
          <span className="font-medium text-amber-600">★ {reviewSummary.average!.toFixed(1)}</span>{" "}
          ({reviewSummary.count} review{reviewSummary.count === 1 ? "" : "s"})
        </p>
      )}

      <div className="mt-3">
        <ZomatoButton vendor={vendor} />
      </div>

      <section className="mt-5 rounded-lg border border-neutral-200 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Official certification
        </h2>
        <div className="mt-2">
          <CertificationBadge status={vendor.certification_status} />
        </div>
        <p className="mt-2 text-xs text-neutral-500">{vendor.source}</p>
      </section>

      <section className="mt-5 rounded-lg border border-neutral-200 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
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
              <dd className="font-medium text-neutral-900">{summary.cleanPrepPct}%</dd>
            </div>
            <div>
              <dt className="text-neutral-500">Gloves/utensils used</dt>
              <dd className="font-medium text-neutral-900">{summary.glovesPct}%</dd>
            </div>
            <div>
              <dt className="text-neutral-500">Covered food storage</dt>
              <dd className="font-medium text-neutral-900">{summary.coveredStoragePct}%</dd>
            </div>
            <div>
              <dt className="text-neutral-500">Clean water access</dt>
              <dd className="font-medium text-neutral-900">{summary.cleanWaterPct}%</dd>
            </div>
            <div className="col-span-2 text-xs text-neutral-400">
              Based on {summary.count} observation{summary.count === 1 ? "" : "s"}.
            </div>
          </dl>
        )}

        <div className="mt-4 border-t border-neutral-100 pt-4">
          <h3 className="text-sm font-medium text-neutral-800">Submit an observation</h3>
          <div className="mt-2">
            <ObservationForm vendorId={vendor.id} isSignedIn={Boolean(user)} />
          </div>
        </div>
      </section>

      <section className="mt-5 rounded-lg border border-neutral-200 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Reviews
        </h2>
        <p className="mt-1 text-xs text-neutral-400">
          Star ratings and comments from app users. Reviews that get reported by several
          different people are automatically taken down pending review — this isn&apos;t part of
          the official certification either.
        </p>

        <div className="mt-3">
          <ReviewsList reviews={reviews} isSignedIn={Boolean(user)} />
        </div>

        <div className="mt-4 border-t border-neutral-100 pt-4">
          <h3 className="text-sm font-medium text-neutral-800">Leave a review</h3>
          <div className="mt-2">
            <ReviewForm vendorId={vendor.id} isSignedIn={Boolean(user)} />
          </div>
        </div>
      </section>
    </main>
  );
}
