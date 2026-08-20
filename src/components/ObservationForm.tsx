"use client";

import { useState } from "react";
import Link from "next/link";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { ChecklistResponses } from "@/lib/types";

const CHECKLIST_ITEMS: { key: keyof Omit<ChecklistResponses, "notes">; label: string }[] = [
  { key: "clean_prep_surface", label: "Visible, clean prep surface" },
  { key: "gloves_or_utensils_used", label: "Gloves or utensils used (not bare hands)" },
  { key: "covered_food_storage", label: "Food stored covered" },
  { key: "clean_water_access", label: "Clean water access visible" },
];

export function ObservationForm({
  vendorId,
  isSignedIn,
}: {
  vendorId: string;
  isSignedIn: boolean;
}) {
  const [checklist, setChecklist] = useState<Omit<ChecklistResponses, "notes">>({
    clean_prep_surface: false,
    gloves_or_utensils_used: false,
    covered_food_storage: false,
    clean_water_access: false,
  });
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  if (!isSupabaseConfigured) {
    return (
      <p className="rounded-md border border-dashed border-neutral-300 bg-neutral-50 p-3 text-sm text-neutral-500">
        Community observations aren&apos;t live yet — this form will start working once the
        database is connected.
      </p>
    );
  }

  if (!isSignedIn) {
    return (
      <p className="rounded-md border border-dashed border-neutral-300 bg-neutral-50 p-3 text-sm text-neutral-600">
        <Link href="/login" className="font-medium text-emerald-700 hover:underline">
          Sign in
        </Link>{" "}
        to submit a hygiene observation.
      </p>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMessage("");

    try {
      const res = await fetch("/api/observations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendor_id: vendorId,
          checklist_responses: { ...checklist, notes },
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Something went wrong submitting your observation.");
      }

      setStatus("success");
      setChecklist({
        clean_prep_surface: false,
        gloves_or_utensils_used: false,
        covered_food_storage: false,
        clean_water_access: false,
      });
      setNotes("");
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {CHECKLIST_ITEMS.map((item) => (
        <label key={item.key} className="flex items-center gap-2 text-sm text-neutral-800">
          <input
            type="checkbox"
            checked={checklist[item.key]}
            onChange={(e) =>
              setChecklist((prev) => ({ ...prev, [item.key]: e.target.checked }))
            }
            className="h-4 w-4 rounded border-neutral-300 text-emerald-600"
          />
          {item.label}
        </label>
      ))}

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Anything else worth noting? (optional)"
        rows={2}
        className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
      />

      <button
        type="submit"
        disabled={status === "submitting"}
        className="rounded-md bg-emerald-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
      >
        {status === "submitting" ? "Submitting…" : "Submit observation"}
      </button>

      {status === "success" && (
        <p className="text-sm text-emerald-700">Thanks — your observation was recorded.</p>
      )}
      {status === "error" && <p className="text-sm text-red-600">{errorMessage}</p>}
    </form>
  );
}
