import { NextResponse, type NextRequest } from "next/server";
import { getVendorCity } from "@/lib/cities";
import { getReviewSummariesByVendor } from "@/lib/reviews";
import { getVendors } from "@/lib/vendors";

export async function GET(request: NextRequest) {
  const city = request.nextUrl.searchParams.get("city")?.trim();
  if (!city || city.length > 80) {
    return NextResponse.json({ error: "A valid city is required." }, { status: 400 });
  }

  const allVendors = await getVendors();
  const vendors = allVendors.filter((vendor) => getVendorCity(vendor) === city);
  const ratings = await getReviewSummariesByVendor(vendors.map((vendor) => vendor.id));

  return NextResponse.json(
    { vendors, ratings: Object.fromEntries(ratings) },
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    }
  );
}
