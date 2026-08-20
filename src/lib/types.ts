export type CertificationStatus =
  | "clean_street_food_hub"
  | "fssai_hygiene_rated"
  | "uncertified"
  | "unknown";

export type VendorCategory =
  | "chaat"
  | "juice"
  | "snacks"
  | "sweets"
  | "beverages"
  | "other";

export interface Vendor {
  id: string;
  name: string;
  lat: number;
  lng: number;
  area: string;
  category: VendorCategory;
  certification_status: CertificationStatus;
  /** Where this data point came from — sourcing is mixed for a while, so track it per vendor. */
  source: string;
  /** Paid placement, set by an admin only — never inferred or auto-assigned. */
  is_sponsored?: boolean;
  /** Verified direct listing URL. If unset, the UI falls back to a labeled Zomato search link. */
  zomato_url?: string | null;
}

export interface Review {
  id: string;
  vendor_id: string;
  user_id: string;
  rating: number;
  comment: string;
  status: "visible" | "hidden";
  report_count: number;
  created_at: string;
}

export interface ReviewSummary {
  count: number;
  average: number | null;
}

export interface ChecklistResponses {
  clean_prep_surface: boolean;
  gloves_or_utensils_used: boolean;
  covered_food_storage: boolean;
  clean_water_access: boolean;
  notes: string;
}

export interface Observation {
  id: string;
  vendor_id: string;
  user_id: string | null;
  checklist_responses: ChecklistResponses;
  submitted_at: string;
}

export const CERTIFICATION_LABELS: Record<CertificationStatus, string> = {
  clean_street_food_hub: "FSSAI Clean Street Food Hub",
  fssai_hygiene_rated: "FSSAI Hygiene Rated",
  uncertified: "Not Certified",
  unknown: "Certification Unknown",
};

export const CATEGORY_LABELS: Record<VendorCategory, string> = {
  chaat: "Chaat",
  juice: "Juice",
  snacks: "Snacks",
  sweets: "Sweets & Desserts",
  beverages: "Beverages",
  other: "Other",
};
