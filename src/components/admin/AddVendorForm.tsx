"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORY_LABELS, CERTIFICATION_LABELS, type CertificationStatus, type VendorCategory } from "@/lib/types";

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function AddVendorForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [area, setArea] = useState("");
  const [category, setCategory] = useState<VendorCategory>("chaat");
  const [certification, setCertification] = useState<CertificationStatus>("unknown");
  const [source, setSource] = useState("");
  const [isSponsored, setIsSponsored] = useState(false);
  const [zomatoUrl, setZomatoUrl] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMessage("");

    try {
      const res = await fetch("/api/admin/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: slugify(name),
          name,
          lat: Number(lat),
          lng: Number(lng),
          area,
          category,
          certification_status: certification,
          source,
          is_sponsored: isSponsored,
          zomato_url: zomatoUrl || null,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Something went wrong adding this stall.");
      }

      setStatus("success");
      setName("");
      setLat("");
      setLng("");
      setArea("");
      setSource("");
      setIsSponsored(false);
      setZomatoUrl("");
      router.refresh();
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 rounded-lg border border-neutral-200 p-4 sm:grid-cols-2">
      <label className="text-sm sm:col-span-2">
        Name
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
        />
      </label>

      <label className="text-sm">
        Latitude
        <input
          required
          type="number"
          step="any"
          value={lat}
          onChange={(e) => setLat(e.target.value)}
          className="mt-1 w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
        />
      </label>

      <label className="text-sm">
        Longitude
        <input
          required
          type="number"
          step="any"
          value={lng}
          onChange={(e) => setLng(e.target.value)}
          className="mt-1 w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
        />
      </label>

      <label className="text-sm sm:col-span-2">
        Area
        <input
          required
          value={area}
          onChange={(e) => setArea(e.target.value)}
          className="mt-1 w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
        />
      </label>

      <label className="text-sm">
        Category
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as VendorCategory)}
          className="mt-1 w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
        >
          {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <label className="text-sm">
        Certification status
        <select
          value={certification}
          onChange={(e) => setCertification(e.target.value as CertificationStatus)}
          className="mt-1 w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
        >
          {Object.entries(CERTIFICATION_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <label className="text-sm sm:col-span-2">
        Source (where this data came from — required)
        <input
          required
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder="e.g. On-site visit, 20 Aug 2026"
          className="mt-1 w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
        />
      </label>

      <label className="text-sm sm:col-span-2">
        Verified Zomato URL (optional)
        <input
          type="url"
          value={zomatoUrl}
          onChange={(e) => setZomatoUrl(e.target.value)}
          placeholder="https://www.zomato.com/mumbai/..."
          className="mt-1 w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
        />
      </label>

      <label className="flex items-center gap-2 text-sm sm:col-span-2">
        <input
          type="checkbox"
          checked={isSponsored}
          onChange={(e) => setIsSponsored(e.target.checked)}
          className="h-4 w-4 rounded border-neutral-300 text-orange-600"
        />
        Sponsored (only if this vendor has actually agreed to paid placement)
      </label>

      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={status === "submitting"}
          className="rounded-md bg-orange-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50"
        >
          {status === "submitting" ? "Adding…" : "Add stall"}
        </button>
        {status === "success" && <p className="mt-2 text-sm text-orange-700">Added.</p>}
        {status === "error" && <p className="mt-2 text-sm text-red-600">{errorMessage}</p>}
      </div>
    </form>
  );
}
