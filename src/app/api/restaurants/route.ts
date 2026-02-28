import { NextRequest, NextResponse } from "next/server";
import { searchRestaurants } from "@/lib/api/foursquare";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const limit = searchParams.get("limit");

  if (!lat || !lng) {
    return NextResponse.json(
      { error: "Latitude and longitude are required" },
      { status: 400 },
    );
  }

  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);
  const limitNum = limit ? parseInt(limit, 10) : 15;

  if (isNaN(latNum) || isNaN(lngNum)) {
    return NextResponse.json(
      { error: "Invalid latitude or longitude" },
      { status: 400 },
    );
  }

  try {
    const restaurants = await searchRestaurants(latNum, lngNum, limitNum);
    return NextResponse.json({ restaurants });
  } catch (error) {
    console.error("Failed to fetch restaurants:", error);
    return NextResponse.json(
      { error: "Failed to fetch restaurants" },
      { status: 500 },
    );
  }
}
