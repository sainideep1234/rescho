import { NextRequest, NextResponse } from "next/server";
import { getRoomById } from "@/lib/room/manager";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> },
) {
  try {
    const { roomId } = await params;
    const room = getRoomById(roomId);

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Return all matched restaurant objects (not just IDs)
    const matchedRestaurants = room.matches
      .map((id) => room.restaurants.find((r) => r.id === id))
      .filter(Boolean);

    return NextResponse.json({
      matches: matchedRestaurants,
      matchCount: matchedRestaurants.length,
    });
  } catch (error) {
    console.error("Matches fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
