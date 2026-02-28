import { NextResponse } from "next/server";
import { getAllRooms } from "@/lib/room/manager";

// Debug endpoint — only use during development to verify rooms are shared
export async function GET() {
  const rooms = getAllRooms();
  return NextResponse.json({
    count: rooms.length,
    rooms: rooms.map((r) => ({
      id: r.id,
      code: r.code,
      userCount: r.users.length,
      restaurantCount: r.restaurants.length,
      status: r.status,
      createdAt: new Date(r.createdAt).toISOString(),
    })),
  });
}
