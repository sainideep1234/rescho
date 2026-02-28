import { NextRequest, NextResponse } from "next/server";
import { getRoomById, addUserToRoom, recordSwipe } from "@/lib/room/manager";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomId, userId, restaurantId, direction } = body as {
      roomId: string;
      userId: string;
      restaurantId: string;
      direction: "left" | "right";
    };

    if (!roomId || !userId || !restaurantId || !direction) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: roomId, userId, restaurantId, direction",
        },
        { status: 400 },
      );
    }

    // Ensure user is in room
    const room = getRoomById(roomId);
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Auto-add user to room if not already in it
    addUserToRoom(roomId, userId);

    // Record the swipe and check for match
    const result = recordSwipe(roomId, userId, restaurantId, direction);

    if (!result.success) {
      return NextResponse.json(
        { error: "Failed to record swipe" },
        { status: 500 },
      );
    }

    // If it's a match, get restaurant details
    let matchedRestaurant = null;
    if (result.isMatch) {
      matchedRestaurant =
        room.restaurants.find((r) => r.id === restaurantId) || null;
    }

    return NextResponse.json({
      success: true,
      isMatch: result.isMatch,
      matchedRestaurant,
    });
  } catch (error) {
    console.error("Failed to record swipe:", error);
    return NextResponse.json(
      { error: "Failed to record swipe" },
      { status: 500 },
    );
  }
}
