// ─────────────────────────────────────────────────────────────────────────────
// src/lib/socket/events.ts — A shared list of all socket event names.
//
// WHY keep names in one place?
//   If you type "join-room" as a string in 10 different files and then want to
//   rename it, you'd have to change all 10 files — and it's easy to miss one.
//   Storing event names here means you only ever need to change one line.
//
// Usage:
//   import { SOCKET_EVENTS } from "@/lib/socket/events";
//   socket.emit(SOCKET_EVENTS.JOIN_ROOM, { roomId, userId });
// ─────────────────────────────────────────────────────────────────────────────

// "as const" tells TypeScript to treat the values as exact string literals
// (e.g. "join-room") instead of the generic type "string".
// This lets TypeScript catch typos when you use these values.
export const SOCKET_EVENTS = {
  // ── Events sent from the CLIENT to the SERVER ──────────────────────────
  JOIN_ROOM: "join-room", // User enters a room.
  LEAVE_ROOM: "leave-room", // User clicks the leave button.
  SWIPE: "swipe", // User swipes left or right on a restaurant.

  // ── Events sent from the SERVER to the CLIENT ──────────────────────────
  PARTNER_JOINED: "partner-joined", // The other user entered the room.
  PARTNER_DISCONNECTED: "partner-disconnected", // The other user left or lost connection.
  PARTNER_SWIPED: "partner-swiped", // The other user just swiped.
  MATCH_FOUND: "match-found", // Both users liked the same restaurant.
  ROOM_READY: "room-ready", // Restaurant data has been loaded.
  ERROR: "error", // Something went wrong on the server.
} as const;

// This type is the union of all possible event name strings.
// Example: "join-room" | "leave-room" | "swipe" | …
// It is useful for typing function parameters that accept any socket event.
export type SocketEventType =
  (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];
