"use client";

import { useState } from "react";
import type { Review } from "@/lib/types";

function StarRow({ rating }: { rating: number }) {
  return (
    <span className="text-amber-400" aria-label={`${rating} out of 5 stars`}>
      {"★".repeat(rating)}
      <span className="text-neutral-300">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

export function ReviewsList({ reviews, isSignedIn }: { reviews: Review[]; isSignedIn: boolean }) {
  const [reported, setReported] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);

  async function handleReport(reviewId: string) {
    if (!isSignedIn || busy) return;
    setBusy(reviewId);
    try {
      const res = await fetch(`/api/reviews/${reviewId}/report`, { method: "POST" });
      if (res.ok) {
        setReported((prev) => new Set(prev).add(reviewId));
      }
    } finally {
      setBusy(null);
    }
  }

  if (reviews.length === 0) {
    return <p className="text-sm text-neutral-500">No reviews yet — be the first.</p>;
  }

  return (
    <ul className="space-y-3">
      {reviews.map((review) => (
        <li key={review.id} className="rounded-md border border-neutral-200 p-3">
          <div className="flex items-center justify-between gap-2">
            <StarRow rating={review.rating} />
            <span className="text-xs text-neutral-400">
              {new Date(review.created_at).toLocaleDateString()}
            </span>
          </div>
          <p className="mt-1.5 text-sm text-neutral-800">{review.comment}</p>
          <div className="mt-1.5">
            {reported.has(review.id) ? (
              <span className="text-xs text-neutral-400">Reported — thanks for flagging it</span>
            ) : isSignedIn ? (
              <button
                type="button"
                onClick={() => handleReport(review.id)}
                disabled={busy === review.id}
                className="text-xs text-neutral-400 hover:text-red-600 disabled:opacity-50"
              >
                Report
              </button>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
