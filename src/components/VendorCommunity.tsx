"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Observation, Review } from "@/lib/types";
import { ObservationForm } from "./ObservationForm";
import { ReviewForm } from "./ReviewForm";
import { ReviewsList } from "./ReviewsList";

async function fetchCommunity(vendorId: string) {
  const [observationResult, reviewResult] = await Promise.allSettled([
    fetch(`/api/observations?vendor_id=${encodeURIComponent(vendorId)}`).then((response) => response.json()),
    fetch(`/api/reviews?vendor_id=${encodeURIComponent(vendorId)}`).then((response) => response.json()),
  ]);

  return {
    observations:
      observationResult.status === "fulfilled" && Array.isArray(observationResult.value)
        ? (observationResult.value as Observation[])
        : [],
    reviews:
      reviewResult.status === "fulfilled" && Array.isArray(reviewResult.value)
        ? (reviewResult.value as Review[])
        : [],
  };
}

export function VendorCommunity({ vendorId, isSignedIn }: { vendorId: string; isSignedIn: boolean }) {
  const [observations, setObservations] = useState<Observation[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const result = await fetchCommunity(vendorId);
    setObservations(result.observations);
    setReviews(result.reviews);
    setLoading(false);
  }, [vendorId]);

  useEffect(() => {
    let active = true;
    void fetchCommunity(vendorId).then((result) => {
      if (!active) return;
      setObservations(result.observations);
      setReviews(result.reviews);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [vendorId]);

  const summary = useMemo(() => {
    const count = observations.length;
    const pct = (key: "clean_prep_surface" | "gloves_or_utensils_used" | "covered_food_storage" | "clean_water_access") =>
      count ? Math.round((observations.filter((item) => item.checklist_responses[key]).length / count) * 100) : 0;
    return {
      count,
      cleanPrepPct: pct("clean_prep_surface"),
      glovesPct: pct("gloves_or_utensils_used"),
      coveredStoragePct: pct("covered_food_storage"),
      cleanWaterPct: pct("clean_water_access"),
    };
  }, [observations]);

  return (
    <>
      <section className="card p-4">
        <h2 className="text-xs font-bold uppercase tracking-wide text-neutral-400">Community observed</h2>
        <p className="mt-1 text-xs text-neutral-400">User reports are separate from official certification.</p>
        {loading ? (
          <p className="mt-3 text-sm text-neutral-500">Loading community reports…</p>
        ) : summary.count === 0 ? (
          <p className="mt-3 text-sm text-neutral-500">No community observations yet.</p>
        ) : (
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div><dt className="text-neutral-500">Clean prep surface</dt><dd className="font-semibold">{summary.cleanPrepPct}%</dd></div>
            <div><dt className="text-neutral-500">Gloves/utensils used</dt><dd className="font-semibold">{summary.glovesPct}%</dd></div>
            <div><dt className="text-neutral-500">Covered storage</dt><dd className="font-semibold">{summary.coveredStoragePct}%</dd></div>
            <div><dt className="text-neutral-500">Clean water visible</dt><dd className="font-semibold">{summary.cleanWaterPct}%</dd></div>
          </dl>
        )}
        <div className="mt-4 border-t border-neutral-100 pt-4">
          <h3 className="text-sm font-semibold text-neutral-800">Submit an observation</h3>
          <div className="mt-2"><ObservationForm vendorId={vendorId} isSignedIn={isSignedIn} onSubmitted={load} /></div>
        </div>
      </section>

      <section className="card p-4">
        <h2 className="text-xs font-bold uppercase tracking-wide text-neutral-400">Reviews</h2>
        <div className="mt-3">{loading ? <p className="text-sm text-neutral-500">Loading reviews…</p> : <ReviewsList reviews={reviews} isSignedIn={isSignedIn} />}</div>
        <div className="mt-4 border-t border-neutral-100 pt-4">
          <h3 className="text-sm font-semibold text-neutral-800">Leave a review</h3>
          <div className="mt-2"><ReviewForm vendorId={vendorId} isSignedIn={isSignedIn} onSubmitted={load} /></div>
        </div>
      </section>
    </>
  );
}
