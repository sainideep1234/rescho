import { NextRequest, NextResponse } from "next/server";
import {
  getRoomById,
  addUserToRoom,
  setRoomRestaurants,
} from "@/lib/room/manager";
import { searchRestaurants } from "@/lib/api/foursquare";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> },
) {
  try {
    const { roomId } = await params;
    const userId = request.nextUrl.searchParams.get("userId");

    if (!roomId) {
      return NextResponse.json({ error: "Room ID required" }, { status: 400 });
    }

    const room = getRoomById(roomId);
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Register user as active if provided
    if (userId) {
      addUserToRoom(roomId, userId);

      // If room has no restaurants yet, fetch them now using the room's location
      if (room.restaurants.length === 0 && room.location) {
        try {
          const restaurants = await searchRestaurants(
            room.location.lat,
            room.location.lng,
            15,
          );
          setRoomRestaurants(roomId, restaurants);
        } catch (err) {
          console.error("Failed to fetch restaurants for room:", err);
          // searchRestaurants already falls back to mock data internally
        }
      }
    }

    // Re-fetch room after possible mutations
    const updatedRoom = getRoomById(roomId);
    if (!updatedRoom) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    return NextResponse.json({
      roomId: updatedRoom.id,
      code: updatedRoom.code,
      status: updatedRoom.status,
      userCount: updatedRoom.users.length,
      partnerConnected: updatedRoom.users.length >= 2,
      restaurants: updatedRoom.restaurants,
      matches: updatedRoom.matches,
      location: updatedRoom.location,
    });
  } catch (error) {
    console.error("Room state error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
