import { Room, Location } from "@/types";
import { generateRoomCode } from "./codeGenerator";
import { v4 as uuidv4 } from "uuid";

// ─────────────────────────────────────────────────────────────────────────────
// CRITICAL: Next.js App Router isolates API route modules, so a plain
// `const rooms = new Map()` is NOT shared between /api/rooms/create and
// /api/rooms/join — each route gets its own empty copy.
// Storing on globalThis gives us ONE true process-wide singleton that all
// routes share, and that survives hot reloads in development.
// ─────────────────────────────────────────────────────────────────────────────
const g = globalThis as typeof globalThis & {
  __rescho_rooms__: Map<string, Room>;
  __rescho_codes__: Map<string, string>;
};
if (!g.__rescho_rooms__) g.__rescho_rooms__ = new Map<string, Room>();
if (!g.__rescho_codes__) g.__rescho_codes__ = new Map<string, string>();

const rooms = g.__rescho_rooms__;
const codeToRoomId = g.__rescho_codes__;

// Cleanup: remove rooms older than 2 hours
const ROOM_TTL = 2 * 60 * 60 * 1000;

export function createRoom(location: Location): Room {
  const roomId = uuidv4();
  let code = generateRoomCode();

  // Ensure unique code
  while (codeToRoomId.has(code)) {
    code = generateRoomCode();
  }

  const room: Room = {
    id: roomId,
    code,
    location,
    users: [],
    restaurants: [],
    swipes: {},
    matches: [],
    status: "waiting",
    createdAt: Date.now(),
  };

  rooms.set(roomId, room);
  codeToRoomId.set(code, roomId);

  return room;
}

export function getRoomById(roomId: string): Room | undefined {
  return rooms.get(roomId);
}

export function getRoomByCode(code: string): Room | undefined {
  const roomId = codeToRoomId.get(code.toUpperCase());
  if (!roomId) return undefined;
  return rooms.get(roomId);
}

export function addUserToRoom(roomId: string, userId: string): boolean {
  const room = rooms.get(roomId);
  if (!room) return false;

  // Always allow existing users back in (reconnects, page refreshes)
  if (room.users.some((u) => u.id === userId)) return true;

  // Only block new users if room is already full
  if (room.users.length >= 2) return false;

  room.users.push({
    id: userId,
    joinedAt: Date.now(),
  });

  // Update status when two users join
  if (room.users.length === 2) {
    room.status = "active";
  }

  return true;
}

export function removeUserFromRoom(roomId: string, userId: string): boolean {
  const room = rooms.get(roomId);
  if (!room) return false;

  room.users = room.users.filter((u) => u.id !== userId);

  // If room is empty, mark for cleanup but don't delete immediately
  if (room.users.length === 0) {
    room.status = "waiting";
  } else if (room.users.length === 1) {
    room.status = "waiting";
  }

  return true;
}

export function setRoomRestaurants(
  roomId: string,
  restaurants: Room["restaurants"],
): boolean {
  const room = rooms.get(roomId);
  if (!room) return false;

  room.restaurants = restaurants;
  return true;
}

export function recordSwipe(
  roomId: string,
  userId: string,
  restaurantId: string,
  direction: "left" | "right",
): { success: boolean; isMatch: boolean } {
  const room = rooms.get(roomId);
  if (!room) return { success: false, isMatch: false };

  // Initialize swipes array for user if not exists
  if (!room.swipes[userId]) {
    room.swipes[userId] = [];
  }

  // Record the swipe
  room.swipes[userId].push({
    restaurantId,
    direction,
    timestamp: Date.now(),
  });

  // Check for match (only on right swipes)
  if (direction === "right") {
    const otherUsers = room.users.filter((u) => u.id !== userId);

    for (const otherUser of otherUsers) {
      const otherSwipes = room.swipes[otherUser.id] || [];
      const otherSwipedRight = otherSwipes.some(
        (s) => s.restaurantId === restaurantId && s.direction === "right",
      );

      if (otherSwipedRight && !room.matches.includes(restaurantId)) {
        room.matches.push(restaurantId);
        return { success: true, isMatch: true };
      }
    }
  }

  return { success: true, isMatch: false };
}

export function getRoomMatches(roomId: string): string[] {
  const room = rooms.get(roomId);
  return room?.matches || [];
}

export function deleteRoom(roomId: string): boolean {
  const room = rooms.get(roomId);
  if (!room) return false;

  codeToRoomId.delete(room.code);
  rooms.delete(roomId);
  return true;
}

// Cleanup old rooms periodically
export function cleanupOldRooms(): void {
  const now = Date.now();

  for (const [roomId, room] of rooms.entries()) {
    if (now - room.createdAt > ROOM_TTL) {
      deleteRoom(roomId);
    }
  }
}

// Export for debugging
export function getAllRooms(): Room[] {
  return Array.from(rooms.values());
}
