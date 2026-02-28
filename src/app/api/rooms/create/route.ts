import { NextRequest, NextResponse } from "next/server";
import { createRoom, addUserToRoom } from "@/lib/room";
import { Location } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { location, userId } = body as {
      location: Location;
      userId?: string;
    };

    if (!location || !location.lat || !location.lng || !location.name) {
      return NextResponse.json(
        { error: "Invalid location data" },
        { status: 400 },
      );
    }

    const room = createRoom(location);

    // Register creator immediately if userId provided
    if (userId) {
      addUserToRoom(room.id, userId);
    }

    return NextResponse.json({
      roomId: room.id,
      code: room.code,
    });
  } catch (error) {
    console.error("Failed to create room:", error);
    return NextResponse.json(
      { error: "Failed to create room" },
      { status: 500 },
    );
  }
}
