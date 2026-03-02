// ─────────────────────────────────────────────────────────────────────────────
// src/lib/room/manager.ts — All functions that create and manage rooms.
//
// A "room" is a shared session where two users swipe on restaurants together.
// Rooms live in memory (RAM) while the server is running — nothing is saved to
// a database.
//
// WHY globalThis?
//   Next.js restarts each API route file in isolation, so a normal `const rooms`
//   variable would be a fresh empty object in every route.  By attaching our
//   data to `globalThis`, we get one single shared object that all routes can
//   read and write — exactly like a global variable in a plain Node.js script.
// ─────────────────────────────────────────────────────────────────────────────

import { Room, Location } from "@/types";
import { generateRoomCode } from "./codeGenerator";
import { v4 as uuidv4 } from "uuid";

// ─── Shared storage (survives hot-reloads in dev) ────────────────────────────

// We "cast" globalThis so TypeScript knows about our custom properties.
const g = globalThis as typeof globalThis & {
  __rescho_rooms__: Map<string, Room>; // roomId  → Room object
  __rescho_codes__: Map<string, string>; // roomCode → roomId
};

// Create the maps only once; after that every import reuses the same ones.
if (!g.__rescho_rooms__) g.__rescho_rooms__ = new Map<string, Room>();
if (!g.__rescho_codes__) g.__rescho_codes__ = new Map<string, string>();

const rooms = g.__rescho_rooms__;
const codeToRoomId = g.__rescho_codes__;

// Rooms are automatically cleaned up after 2 hours of inactivity.
const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

// ─────────────────────────────────────────────────────────────────────────────
// createRoom
//
// Called when a user clicks "Create Room".
// Builds a fresh Room object, stores it, and returns it.
// ─────────────────────────────────────────────────────────────────────────────
export function createRoom(location: Location): Room {
  // uuidv4() generates a unique random ID like "a3f8b2c4-…".
  const roomId = uuidv4();

  // Generate a short human-readable code (e.g. "XK7M2P") users can share.
  let code = generateRoomCode();

  // Keep trying until we get a code that isn't already in use.
  while (codeToRoomId.has(code)) {
    code = generateRoomCode();
  }

  // Build the room with all fields set to their starting values.
  const room: Room = {
    id: roomId,
    code,
    location, // The lat/lng used to search for nearby restaurants.
    users: [], // Will hold up to 2 user objects once people join.
    restaurants: [], // Filled in later by the socket server.
    swipes: {}, // Keyed by userId; each value is an array of swipe records.
    matches: [], // Array of restaurantIds that both users liked.
    status: "waiting", // "waiting" | "active" — changes when 2 users join.
    createdAt: Date.now(),
  };

  // Save it in both lookup structures.
  rooms.set(roomId, room);
  codeToRoomId.set(code, roomId);

  return room;
}

// ─────────────────────────────────────────────────────────────────────────────
// getRoomById / getRoomByCode
//
// Simple lookups — return the room, or undefined if it doesn't exist.
// ─────────────────────────────────────────────────────────────────────────────
export function getRoomById(roomId: string): Room | undefined {
  return rooms.get(roomId);
}

export function getRoomByCode(code: string): Room | undefined {
  // Codes are always stored in uppercase so the comparison always works.
  const roomId = codeToRoomId.get(code.toUpperCase());
  if (!roomId) return undefined;
  return rooms.get(roomId);
}

// ─────────────────────────────────────────────────────────────────────────────
// addUserToRoom
//
// Adds a user to the room when they press "Join".
// Returns true on success, false if the room is full or not found.
// ─────────────────────────────────────────────────────────────────────────────
export function addUserToRoom(roomId: string, userId: string): boolean {
  const room = rooms.get(roomId);
  if (!room) return false; // Room doesn't exist.

  // If the user is already in the room (e.g. they refreshed the page), just
  // return true — no need to add them again.
  const alreadyInRoom = room.users.some((user) => user.id === userId);
  if (alreadyInRoom) return true;

  // Don't allow a third person to join.
  if (room.users.length >= 2) return false;

  // Add the user with a join timestamp.
  room.users.push({
    id: userId,
    joinedAt: Date.now(),
  });

  // Once two users are in, the room becomes "active".
  if (room.users.length === 2) {
    room.status = "active";
  }

  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// removeUserFromRoom
//
// Called when a user leaves or disconnects.
// Keeps the room alive so the other user isn't left with a broken screen.
// ─────────────────────────────────────────────────────────────────────────────
export function removeUserFromRoom(roomId: string, userId: string): boolean {
  const room = rooms.get(roomId);
  if (!room) return false;

  // Remove just this user from the list (keep everyone else).
  room.users = room.users.filter((user) => user.id !== userId);

  // Go back to "waiting" if the room now has fewer than 2 people.
  if (room.users.length < 2) {
    room.status = "waiting";
  }

  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// setRoomRestaurants
//
// Saves the list of restaurants fetched from the API into the room.
// Called once per room, right after the first fetch succeeds.
// ─────────────────────────────────────────────────────────────────────────────
export function setRoomRestaurants(
  roomId: string,
  restaurants: Room["restaurants"],
): boolean {
  const room = rooms.get(roomId);
  if (!room) return false;

  room.restaurants = restaurants;
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// recordSwipe
//
// Called every time a user swipes left or right.
// Returns { success, isMatch } — isMatch is true if both users liked the same
// restaurant.
// ─────────────────────────────────────────────────────────────────────────────
export function recordSwipe(
  roomId: string,
  userId: string,
  restaurantId: string,
  direction: "left" | "right",
): { success: boolean; isMatch: boolean } {
  const room = rooms.get(roomId);
  if (!room) return { success: false, isMatch: false };

  // Create the swipe list for this user if it doesn't exist yet.
  if (!room.swipes[userId]) {
    room.swipes[userId] = [];
  }

  // Add the swipe to the list.
  room.swipes[userId].push({
    restaurantId,
    direction,
    timestamp: Date.now(),
  });

  // Only right swipes can produce a match.
  if (direction === "right") {
    // Get the list of everyone else in the room.
    const otherUsers = room.users.filter((user) => user.id !== userId);

    for (const otherUser of otherUsers) {
      const theirSwipes = room.swipes[otherUser.id] || [];

      // Did the other user already swipe right on THIS restaurant?
      const theyAlsoLikedIt = theirSwipes.some(
        (swipe) =>
          swipe.restaurantId === restaurantId && swipe.direction === "right",
      );

      // It's a match — and we haven't recorded it yet.
      if (theyAlsoLikedIt && !room.matches.includes(restaurantId)) {
        room.matches.push(restaurantId);
        return { success: true, isMatch: true };
      }
    }
  }

  // Swipe recorded, but no match this time.
  return { success: true, isMatch: false };
}

// ─────────────────────────────────────────────────────────────────────────────
// getRoomMatches
//
// Returns all restaurant IDs that both users have liked.
// ─────────────────────────────────────────────────────────────────────────────
export function getRoomMatches(roomId: string): string[] {
  const room = rooms.get(roomId);
  return room?.matches || [];
}

// ─────────────────────────────────────────────────────────────────────────────
// deleteRoom
//
// Permanently removes a room and frees up its short code.
// ─────────────────────────────────────────────────────────────────────────────
export function deleteRoom(roomId: string): boolean {
  const room = rooms.get(roomId);
  if (!room) return false;

  codeToRoomId.delete(room.code); // Free up the short code for reuse.
  rooms.delete(roomId);
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// cleanupOldRooms
//
// Removes rooms that were created more than 2 hours ago.
// Should be called on a schedule (e.g. every 30 minutes) to prevent
// memory from growing forever.
// ─────────────────────────────────────────────────────────────────────────────
export function cleanupOldRooms(): void {
  const now = Date.now();

  for (const [roomId, room] of rooms.entries()) {
    if (now - room.createdAt > TWO_HOURS_MS) {
      deleteRoom(roomId);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// getAllRooms  (debugging only)
//
// Returns every active room as an array. Useful for logging or admin tools.
// ─────────────────────────────────────────────────────────────────────────────
export function getAllRooms(): Room[] {
  return Array.from(rooms.values());
}
