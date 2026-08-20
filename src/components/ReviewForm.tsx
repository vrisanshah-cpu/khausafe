"use client";

import { useState } from "react";
import Link from "next/link";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export function ReviewForm({
  vendorId,
  isSignedIn,
  onSubmitted,
}: {
  vendorId: string;
  isSignedIn: boolean;
  onSubmitted?: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  if (!isSupabaseConfigured) {
    return (
      <p className="rounded-md border border-dashed border-neutral-300 bg-neutral-50 p-3 text-sm text-neutral-500">
        Reviews aren&apos;t live yet — this form will start working once the database is
        connected.
      </p>
    );
  }

  if (!isSignedIn) {
    return (
      <p className="rounded-md border border-dashed border-neutral-300 bg-neutral-50 p-3 text-sm text-neutral-600">
        <Link href="/login" className="font-medium text-orange-700 hover:underline">
          Sign in
        </Link>{" "}
        to leave a review.
      </p>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setStatus("error");
      setErrorMessage("Pick a star rating first.");
      return;
    }

    setStatus("submitting");
    setErrorMessage("");

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendor_id: vendorId, rating, comment }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Something went wrong submitting your review.");
      }

      setStatus("success");
      setRating(0);
      setComment("");
      onSubmitted?.();
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-1" onMouseLeave={() => setHoverRating(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            onMouseEnter={() => setHoverRating(n)}
            aria-label={`${n} star${n === 1 ? "" : "s"}`}
            className="text-2xl leading-none"
          >
            <span
              className={
                n <= (hoverRating || rating) ? "text-amber-400" : "text-neutral-300"
              }
            >
              ★
            </span>
          </button>
        ))}
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="How was it? (visible to other users)"
        rows={2}
        maxLength={500}
        required
        className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
      />

      <button
        type="submit"
        disabled={status === "submitting"}
        className="rounded-md bg-orange-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50"
      >
        {status === "submitting" ? "Posting…" : "Post review"}
      </button>

      {status === "success" && (
        <p className="text-sm text-orange-700">Thanks — your review is live.</p>
      )}
      {status === "error" && <p className="text-sm text-red-600">{errorMessage}</p>}
    </form>
  );
}
