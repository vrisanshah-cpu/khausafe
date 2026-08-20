import Link from "next/link";
import { CATEGORY_LABELS, type Vendor } from "@/lib/types";
import { CertificationBadge } from "./CertificationBadge";

export function VendorList({ vendors }: { vendors: Vendor[] }) {
  if (vendors.length === 0) {
    return (
      <p className="p-4 text-sm text-neutral-500">
        No vendors match these filters yet.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-neutral-200 overflow-y-auto">
      {vendors.map((vendor) => (
        <li key={vendor.id}>
          <Link
            href={`/vendors/${vendor.id}`}
            className="block px-4 py-3 hover:bg-neutral-50"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium text-neutral-900">{vendor.name}</p>
                <p className="text-xs text-neutral-500">
                  {vendor.area} &middot; {CATEGORY_LABELS[vendor.category]}
                </p>
              </div>
            </div>
            <div className="mt-2">
              <CertificationBadge status={vendor.certification_status} />
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
