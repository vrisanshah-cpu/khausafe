"use client";

import { useState } from "react";
import type { Review, Vendor } from "@/lib/types";

export function ModerationQueue({ reviews, vendors }: { reviews: Review[]; vendors: Vendor[] }) {
  const [localReviews, setLocalReviews] = useState(reviews);
  const [busyId, setBusyId] = useState<string | null>(null);
  const vendorName = (id: string) => vendors.find((v) => v.id === id)?.name ?? id;

  async function act(id: string, method: "PATCH" | "DELETE") {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, { method });
      if (res.ok) {
        setLocalReviews((prev) => prev.filter((r) => r.id !== id));
      }
    } finally {
      setBusyId(null);
    }
  }

  if (localReviews.length === 0) {
    return <p className="text-sm text-neutral-500">Nothing waiting for review right now.</p>;
  }

  return (
    <ul className="space-y-2">
      {localReviews.map((review) => (
        <li key={review.id} className="rounded-md border border-red-200 bg-red-50 p-3">
          <p className="text-xs font-medium text-neutral-500">
            {vendorName(review.vendor_id)} &middot; reported {review.report_count}×
          </p>
          <p className="mt-1 text-sm text-neutral-800">
            {"★".repeat(review.rating)} {review.comment}
          </p>
          <div className="mt-2 flex gap-3">
            <button
              type="button"
              disabled={busyId === review.id}
              onClick={() => act(review.id, "PATCH")}
              className="text-xs font-medium text-orange-700 hover:underline disabled:opacity-50"
            >
              Restore
            </button>
            <button
              type="button"
              disabled={busyId === review.id}
              onClick={() => act(review.id, "DELETE")}
              className="text-xs font-medium text-red-700 hover:underline disabled:opacity-50"
            >
              Delete permanently
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
