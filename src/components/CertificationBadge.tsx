import { CERTIFICATION_LABELS, type CertificationStatus } from "@/lib/types";

const STYLES: Record<CertificationStatus, string> = {
  clean_street_food_hub: "bg-emerald-100 text-emerald-800 border-emerald-300",
  fssai_hygiene_rated: "bg-emerald-100 text-emerald-800 border-emerald-300",
  uncertified: "bg-amber-100 text-amber-800 border-amber-300",
  unknown: "bg-neutral-100 text-neutral-600 border-neutral-300",
};

export function CertificationBadge({ status }: { status: CertificationStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${STYLES[status]}`}
    >
      {(status === "clean_street_food_hub" || status === "fssai_hygiene_rated") && (
        <span aria-hidden>✓</span>
      )}
      {CERTIFICATION_LABELS[status]}
    </span>
  );
}
