"use client";

import { useState } from "react";
import type { Vendor } from "@/lib/types";

export function VendorAdminList({ vendors }: { vendors: Vendor[] }) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [localVendors, setLocalVendors] = useState(vendors);

  async function patch(id: string, body: Record<string, unknown>) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/vendors/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const updated = await res.json();
        setLocalVendors((prev) => prev.map((v) => (v.id === id ? { ...v, ...updated } : v)));
      }
    } finally {
      setBusyId(null);
    }
  }

  return (
    <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200">
      {localVendors.map((vendor) => (
        <li key={vendor.id} className="flex flex-wrap items-center justify-between gap-2 p-3">
          <div>
            <p className="text-sm font-medium text-neutral-900">{vendor.name}</p>
            <p className="text-xs text-neutral-500">{vendor.area}</p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-xs text-neutral-600">
              <input
                type="checkbox"
                checked={Boolean(vendor.is_sponsored)}
                disabled={busyId === vendor.id}
                onChange={(e) => patch(vendor.id, { is_sponsored: e.target.checked })}
                className="h-3.5 w-3.5 rounded border-neutral-300 text-orange-600"
              />
              Sponsored
            </label>
            <button
              type="button"
              disabled={busyId === vendor.id}
              onClick={() => {
                const url = prompt("Verified Zomato URL (blank to clear):", vendor.zomato_url ?? "");
                if (url === null) return;
                patch(vendor.id, { zomato_url: url || null });
              }}
              className="text-xs font-medium text-orange-700 hover:underline disabled:opacity-50"
            >
              {vendor.zomato_url ? "Edit Zomato link" : "Add Zomato link"}
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
