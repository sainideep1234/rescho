// ─────────────────────────────────────────────────────────────────────────────
// server/index.ts — The main entry point that starts the whole server.
//
// What this file does:
//   1. Boots up the Next.js app (so React pages work normally).
//   2. Creates a plain HTTP server on top of it.
//   3. Attaches a Socket.IO server so users can talk to each other in real-time.
//   4. Registers all the socket event listeners (join room, swipe, disconnect…).
// ─────────────────────────────────────────────────────────────────────────────

import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server as SocketServer } from "socket.io";
import type { Socket } from "socket.io";

// These functions manage rooms that are stored in memory.
import {
  getRoomById,
  addUserToRoom,
  removeUserFromRoom,
  recordSwipe,
  setRoomRestaurants,
} from "../src/lib/room/manager";

// This function fetches nearby restaurants from the Foursquare API.
import { searchRestaurants } from "../src/lib/api/foursquare";

// ─── Server configuration ────────────────────────────────────────────────────

// "dev" is true when we are running locally (not on the live website).
const dev = process.env.NODE_ENV !== "production";

const hostname = "localhost";

// Use the PORT environment variable if the hosting provider sets one,
// otherwise default to port 3000.
const port = parseInt(process.env.PORT || "3000", 10);

// ─── Two simple lookup tables ────────────────────────────────────────────────

// We need to know which user belongs to which socket connection, and which
// room that user is in — so we can clean things up when they disconnect.
//
// Map<socketId, userId>  — given a socket, which user is it?
const userSockets = new Map<string, string>();

// Map<userId, roomId>  — given a user, which room are they in?
const userRooms = new Map<string, string>();

// ─── Boot Next.js, then start the server ────────────────────────────────────

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler(); // Next.js handles all normal web requests.

app.prepare().then(() => {
  // List of frontend URLs that are allowed to connect.
  // We filter out any undefined values (env vars that weren't set).
  const allowedOrigins = [
    `http://localhost:${port}`,
    "http://localhost:3000",
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.FRONTEND_URL,
  ].filter(Boolean) as string[];

  // ─── HTTP server ────────────────────────────────────────────────────────
  // Every incoming request goes through this callback first.
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);

    // /health is a simple ping endpoint.
    // Services like UptimeRobot call it every few minutes so the server
    // doesn't "fall asleep" on free hosting plans.
    if (parsedUrl.pathname === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({ status: "ok", timestamp: new Date().toISOString() }),
      );
      return;
    }

    // For every other URL, let Next.js handle it (pages, API routes, etc.).
    handle(req, res, parsedUrl);
  });

  // ─── Socket.IO server ───────────────────────────────────────────────────
  // Socket.IO piggy-backs on the same HTTP server so we only need one port.
  const io = new SocketServer(httpServer, {
    cors: {
      // Only connections from our own frontend are allowed.
      origin: (origin, callback) => {
        // Requests with no origin header (e.g. server-to-server pings) are fine.
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        callback(new Error(`CORS blocked: ${origin}`));
      },
      methods: ["GET", "POST"],
      credentials: true,
    },
    // The client connects to this URL path, not the default "/socket.io".
    path: "/api/socketio",
  });

  // ─── Socket event handlers ───────────────────────────────────────────────
  // This runs every time a new browser tab connects.
  io.on("connection", (socket: Socket) => {
    console.log(`New connection: ${socket.id}`);

    // ── Event: "join-room" ──────────────────────────────────────────────
    // Fired when a user opens a room page.
    // The client sends: { roomId, userId }
    socket.on("join-room", async (data: { roomId: string; userId: string }) => {
      const { roomId, userId } = data;

      // Make sure the room actually exists.
      const room = getRoomById(roomId);
      if (!room) {
        socket.emit("error", { message: "Room not found" });
        return;
      }

      // Try to add this user to the room (max 2 users per room).
      const joined = addUserToRoom(roomId, userId);
      if (!joined) {
        socket.emit("error", { message: "Failed to join room" });
        return;
      }

      // Remember which user owns this socket connection, and which room
      // they are in — so we can clean up if they disconnect unexpectedly.
      userSockets.set(socket.id, userId);
      userRooms.set(userId, roomId);

      // "socket.join(roomId)" puts this socket into a named channel.
      // We can later use io.to(roomId).emit() to send messages to everyone in it.
      socket.join(roomId);

      // Tell everyone else in the room that a new person arrived.
      socket.to(roomId).emit("partner-joined", { partnerId: userId });

      // Fetch restaurants only once per room (the first user triggers it).
      const freshRoom = getRoomById(roomId);

      if (freshRoom && freshRoom.restaurants.length === 0) {
        // No restaurants loaded yet — go fetch them now.
        try {
          const restaurants = await searchRestaurants(
            freshRoom.location.lat,
            freshRoom.location.lng,
            50,
          );

          // Save the list so the second user doesn't have to fetch again.
          setRoomRestaurants(roomId, restaurants);

          // Tell everyone in the room the data is ready.
          io.to(roomId).emit("room-ready", {
            restaurants: restaurants.length,
            restaurantData: restaurants,
          });
        } catch (error) {
          console.error("Failed to fetch restaurants:", error);
          socket.emit("error", { message: "Failed to load restaurants" });
        }
      } else if (freshRoom && freshRoom.restaurants.length > 0) {
        // Restaurants were already fetched for this room.
        // Just send the cached list directly to the new user.
        socket.emit("room-ready", {
          restaurants: freshRoom.restaurants.length,
          restaurantData: freshRoom.restaurants,
        });
      }

      console.log(`User ${userId} joined room ${roomId}`);
    });

    // ── Event: "swipe" ──────────────────────────────────────────────────
    // Fired when a user swipes left or right on a restaurant card.
    // The client sends: { roomId, userId, restaurantId, direction }
    socket.on(
      "swipe",
      (data: {
        roomId: string;
        userId: string;
        restaurantId: string;
        direction: "left" | "right";
      }) => {
        const { roomId, userId, restaurantId, direction } = data;

        // Record this swipe and check if it creates a match.
        const result = recordSwipe(roomId, userId, restaurantId, direction);

        if (!result.success) {
          socket.emit("error", { message: "Failed to record swipe" });
          return;
        }

        // Let the other person know their partner just swiped (useful for
        // showing a "partner is swiping…" indicator).
        socket.to(roomId).emit("partner-swiped", { restaurantId, direction });

        // If both users swiped right on the same restaurant — it's a match!
        if (result.isMatch) {
          // Look up the full restaurant details so we can show them in the match screen.
          const room = getRoomById(roomId);
          const restaurant = room?.restaurants.find(
            (r: { id: string }) => r.id === restaurantId,
          );

          // Notify BOTH users (io.to sends to the whole room, including the sender).
          io.to(roomId).emit("match-found", {
            restaurantId,
            restaurantName: restaurant?.name || "Restaurant",
            restaurant,
          });
        }
      },
    );

    // ── Event: "leave-room" ─────────────────────────────────────────────
    // Fired when the user clicks a "Leave" button intentionally.
    socket.on("leave-room", (data: { roomId: string; userId: string }) => {
      const { roomId, userId } = data;
      leaveRoom(socket, userId, roomId);
    });

    // ── Event: "disconnect" ─────────────────────────────────────────────
    // Fired automatically when the browser tab is closed or the internet
    // drops. We use our lookup tables to figure out who left.
    socket.on("disconnect", () => {
      const userId = userSockets.get(socket.id);
      const roomId = userId ? userRooms.get(userId) : null;

      if (userId && roomId) {
        leaveRoom(socket, userId, roomId);
      }

      console.log(`Disconnected: ${socket.id}`);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Helper: leaveRoom
  //
  // Called both on a manual "leave-room" event and on an accidental disconnect.
  // It removes the user from the room, tells their partner, and cleans up the
  // lookup tables.
  // ─────────────────────────────────────────────────────────────────────────
  function leaveRoom(socket: Socket, userId: string, roomId: string) {
    removeUserFromRoom(roomId, userId);

    // Remove this socket from the Socket.IO channel.
    socket.leave(roomId);

    // Tell the partner their friend left.
    socket.to(roomId).emit("partner-disconnected", { partnerId: userId });

    // Remove entries from our lookup tables to free memory.
    userSockets.delete(socket.id);
    userRooms.delete(userId);
  }

  // ─── Start listening ─────────────────────────────────────────────────────
  httpServer.listen(port, () => {
    console.log(`> Server ready on http://${hostname}:${port}`);
  });
});
