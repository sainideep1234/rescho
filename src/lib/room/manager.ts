import { Room, Location } from "@/types";
import { generateRoomCode } from "./codeGenerator";
import { v4 as uuidv4 } from "uuid";

/**
 * Shared storage for rooms, attached to globalThis to survive hot-reloads in development.
 */
const g = globalThis as typeof globalThis & {
  __rescho_rooms__: Map<string, Room>;
  __rescho_codes__: Map<string, string>;
};

if (!g.__rescho_rooms__) g.__rescho_rooms__ = new Map<string, Room>();
if (!g.__rescho_codes__) g.__rescho_codes__ = new Map<string, string>();

const rooms = g.__rescho_rooms__;
const codeToRoomId = g.__rescho_codes__;
const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

/**
 * Creates a new room with a unique ID and human-readable code.
 */
export function createRoom(location: Location): Room {
  const roomId = uuidv4();
  let code = generateRoomCode();

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

/**
 * Look up a room by its human-readable code (case-insensitive).
 */
export function getRoomByCode(code: string): Room | undefined {
  const roomId = codeToRoomId.get(code.toUpperCase());
  return roomId ? rooms.get(roomId) : undefined;
}

/**
 * Adds a user to a room if space is available.
 */
export function addUserToRoom(roomId: string, userId: string): boolean {
  const room = rooms.get(roomId);
  if (!room) return false;

  if (room.users.some((user) => user.id === userId)) return true;
  if (room.users.length >= 2) return false;

  room.users.push({ id: userId, joinedAt: Date.now() });

  if (room.users.length === 2) {
    room.status = "active";
  }

  return true;
}

/**
 * Removes a user from a room and resets status to waiting if needed.
 */
export function removeUserFromRoom(roomId: string, userId: string): boolean {
  const room = rooms.get(roomId);
  if (!room) return false;

  room.users = room.users.filter((user) => user.id !== userId);

  if (room.users.length < 2) {
    room.status = "waiting";
  }

  return true;
}

/**
 * Updates the cached list of restaurants for a room.
 */
export function setRoomRestaurants(
  roomId: string,
  restaurants: Room["restaurants"],
): boolean {
  const room = rooms.get(roomId);
  if (!room) return false;

  room.restaurants = restaurants;
  return true;
}

/**
 * Records a user's swipe and checks for a mutual match.
 */
export function recordSwipe(
  roomId: string,
  userId: string,
  restaurantId: string,
  direction: "left" | "right",
): { success: boolean; isMatch: boolean } {
  const room = rooms.get(roomId);
  if (!room) return { success: false, isMatch: false };

  if (!room.swipes[userId]) {
    room.swipes[userId] = [];
  }

  room.swipes[userId].push({
    restaurantId,
    direction,
    timestamp: Date.now(),
  });

  if (direction === "right") {
    const otherUsers = room.users.filter((user) => user.id !== userId);

    for (const otherUser of otherUsers) {
      const theirSwipes = room.swipes[otherUser.id] || [];
      const theyAlsoLikedIt = theirSwipes.some(
        (swipe) => swipe.restaurantId === restaurantId && swipe.direction === "right",
      );

      if (theyAlsoLikedIt && !room.matches.includes(restaurantId)) {
        room.matches.push(restaurantId);
        return { success: true, isMatch: true };
      }
    }
  }

  return { success: true, isMatch: false };
}

export function getRoomMatches(roomId: string): string[] {
  return rooms.get(roomId)?.matches || [];
}

/**
 * Permanently deletes a room and releases its code.
 */
export function deleteRoom(roomId: string): boolean {
  const room = rooms.get(roomId);
  if (!room) return false;

  codeToRoomId.delete(room.code);
  rooms.delete(roomId);
  return true;
}

/**
 * Periodically removes inactive rooms to prevent memory leaks.
 */
export function cleanupOldRooms(): void {
  const now = Date.now();

  for (const [roomId, room] of rooms.entries()) {
    if (now - room.createdAt > TWO_HOURS_MS) {
      deleteRoom(roomId);
    }
  }
}

/**
 * Returns all active rooms (for debugging/admin purposes).
 */
export function getAllRooms(): Room[] {
  return Array.from(rooms.values());
}

