// ─────────────────────────────────────────────────────────────────────────────
// src/lib/socket/server.ts — Server-side Socket.IO initialisation.
//
// This file wires the Socket.IO server to the existing HTTP server created by
// Next.js.  It receives real-time events from connected browsers and emits
// events back to them.
//
// NOTE: This file is only used in development (custom server mode).
//       On some hosting platforms the socket logic lives entirely in
//       server/index.ts instead.
// ─────────────────────────────────────────────────────────────────────────────

import { Server as HttpServer } from "http";
import { Server as SocketServer, Socket } from "socket.io";

import {
  getRoomById,
  addUserToRoom,
  removeUserFromRoom,
  recordSwipe,
  setRoomRestaurants,
} from "@/lib/room";

import { searchRestaurants } from "@/lib/api/foursquare";

// ─────────────────────────────────────────────────────────────────────────────
// Module-level state
//
// io        — the Socket.IO server instance (created once, reused forever).
// userSockets — maps each socket connection to the user who owns it.
// userRooms   — maps each user to the room they are currently in.
//
// Both maps are used to clean up when a user disconnects unexpectedly.
// ─────────────────────────────────────────────────────────────────────────────
let io: SocketServer | null = null;

const userSockets = new Map<string, string>(); // socketId → userId
const userRooms = new Map<string, string>(); // userId   → roomId

// ─────────────────────────────────────────────────────────────────────────────
// initSocketServer
//
// Attaches a Socket.IO server to the provided HTTP server and registers all
// event handlers.  Returns the same instance on subsequent calls instead of
// creating a second one (singleton pattern).
// ─────────────────────────────────────────────────────────────────────────────
export function initSocketServer(httpServer: HttpServer): SocketServer {
  // If already initialised, return the existing instance.
  if (io) return io;

  io = new SocketServer(httpServer, {
    cors: {
      // Only allow connections from our own frontend URL.
      origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
    },
    // Browser clients must connect to this path (not the default "/socket.io").
    path: "/api/socketio",
  });

  // ── "connection" fires every time a new browser tab connects. ───────────
  io.on("connection", (socket: Socket) => {
    console.log(`New connection: ${socket.id}`);

    // ── Event: "join-room" ────────────────────────────────────────────────
    // Fired when a user loads a room page.
    // Payload: { roomId: string, userId: string }
    socket.on("join-room", async (data: { roomId: string; userId: string }) => {
      const { roomId, userId } = data;

      // Verify the room exists.
      const room = getRoomById(roomId);
      if (!room) {
        socket.emit("error", { message: "Room not found" });
        return;
      }

      // Try to seat the user (max 2 per room).
      const joined = addUserToRoom(roomId, userId);
      if (!joined) {
        socket.emit("error", { message: "Failed to join room" });
        return;
      }

      // Remember which user owns this connection for the disconnect handler.
      userSockets.set(socket.id, userId);
      userRooms.set(userId, roomId);

      // socket.join() adds this socket to a named group.
      // We can then send messages to everyone in the group with io.to(roomId).
      socket.join(roomId);

      // Tell others in the room that someone new arrived.
      socket.to(roomId).emit("partner-joined", { partnerId: userId });

      // ── Load restaurants (once per room) ────────────────────────────────
      const freshRoom = getRoomById(roomId);

      if (freshRoom && freshRoom.restaurants.length === 0) {
        // First user in — fetch restaurant data from the API.
        try {
          const restaurants = await searchRestaurants(
            freshRoom.location.lat,
            freshRoom.location.lng,
            50,
          );

          setRoomRestaurants(roomId, restaurants); // Cache for the second user.

          io?.to(roomId).emit("room-ready", {
            restaurants: restaurants.length,
            restaurantData: restaurants,
          });
        } catch (error) {
          console.error("Failed to fetch restaurants:", error);
          socket.emit("error", { message: "Failed to load restaurants" });
        }
      } else if (freshRoom && freshRoom.restaurants.length > 0) {
        // Second user — restaurants are already cached, just send them directly.
        socket.emit("room-ready", {
          restaurants: freshRoom.restaurants.length,
          restaurantData: freshRoom.restaurants,
        });
      }

      console.log(`User ${userId} joined room ${roomId}`);
    });

    // ── Event: "swipe" ────────────────────────────────────────────────────
    // Fired when a user swipes on a restaurant card.
    // Payload: { roomId, userId, restaurantId, direction: "left" | "right" }
    socket.on(
      "swipe",
      (data: {
        roomId: string;
        userId: string;
        restaurantId: string;
        direction: "left" | "right";
      }) => {
        const { roomId, userId, restaurantId, direction } = data;

        const result = recordSwipe(roomId, userId, restaurantId, direction);

        if (!result.success) {
          socket.emit("error", { message: "Failed to record swipe" });
          return;
        }

        // Tell the other user their partner swiped (useful for a progress indicator).
        socket.to(roomId).emit("partner-swiped", { restaurantId, direction });

        // If it's a match, tell BOTH users (io.to includes the sender).
        if (result.isMatch) {
          const room = getRoomById(roomId);
          const restaurant = room?.restaurants.find(
            (r) => r.id === restaurantId,
          );

          io?.to(roomId).emit("match-found", {
            restaurantId,
            restaurantName: restaurant?.name || "Restaurant",
            restaurant,
          });
        }
      },
    );

    // ── Event: "leave-room" ───────────────────────────────────────────────
    // Fired when the user deliberately clicks a "Leave" button.
    socket.on("leave-room", (data: { roomId: string; userId: string }) => {
      leaveRoom(socket, data.userId, data.roomId);
    });

    // ── Event: "disconnect" ───────────────────────────────────────────────
    // Fired automatically when the browser tab is closed or the network drops.
    socket.on("disconnect", () => {
      const userId = userSockets.get(socket.id);
      const roomId = userId ? userRooms.get(userId) : null;

      if (userId && roomId) {
        leaveRoom(socket, userId, roomId);
      }

      console.log(`Disconnected: ${socket.id}`);
    });
  });

  return io;
}

// ─────────────────────────────────────────────────────────────────────────────
// leaveRoom  (private helper)
//
// Removes a user from the room data, leaves the socket channel, notifies
// their partner, and clears the lookup table entries.
// ─────────────────────────────────────────────────────────────────────────────
function leaveRoom(socket: Socket, userId: string, roomId: string) {
  removeUserFromRoom(roomId, userId);
  socket.leave(roomId);

  socket.to(roomId).emit("partner-disconnected", { partnerId: userId });

  userSockets.delete(socket.id);
  userRooms.delete(userId);
}

// ─────────────────────────────────────────────────────────────────────────────
// getSocketServer
//
// Returns the current Socket.IO server instance (or null if not started yet).
// Useful for sending events from API routes that don't have a socket reference.
// ─────────────────────────────────────────────────────────────────────────────
export function getSocketServer(): SocketServer | null {
  return io;
}
