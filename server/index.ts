import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server as SocketServer } from "socket.io";
import type { Socket } from "socket.io";
import {
  getRoomById,
  addUserToRoom,
  removeUserFromRoom,
  recordSwipe,
  setRoomRestaurants,
} from "../src/lib/room/manager";
import { searchRestaurants } from "../src/lib/api/foursquare";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const userSockets = new Map<string, string>(); // socketId -> userId
const userRooms = new Map<string, string>(); // userId -> roomId

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const allowedOrigins = [
    `http://localhost:${port}`,
    "http://localhost:3000",
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.FRONTEND_URL,
  ].filter(Boolean) as string[];

  /**
   * HTTP Server initialization with health check and Next.js request handling.
   */
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);

    if (parsedUrl.pathname === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok", timestamp: new Date().toISOString() }));
      return;
    }

    handle(req, res, parsedUrl);
  });

  /**
   * Socket.IO server configuration with CORS and custom path.
   */
  const io = new SocketServer(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
        callback(new Error(`CORS blocked: ${origin}`));
      },
      methods: ["GET", "POST"],
      credentials: true,
    },
    path: "/api/socketio",
  });

  io.on("connection", (socket: Socket) => {
    console.log(`New connection: ${socket.id}`);

    /**
     * Join room event: registers user, joins socket room, and fetches restaurants if needed.
     */
    socket.on("join-room", async (data: { roomId: string; userId: string }) => {
      const { roomId, userId } = data;

      const room = getRoomById(roomId);
      if (!room) {
        socket.emit("error", { message: "Room not found" });
        return;
      }

      if (!addUserToRoom(roomId, userId)) {
        socket.emit("error", { message: "Failed to join room" });
        return;
      }

      userSockets.set(socket.id, userId);
      userRooms.set(userId, roomId);
      socket.join(roomId);

      socket.to(roomId).emit("partner-joined", { partnerId: userId });

      const freshRoom = getRoomById(roomId);
      if (freshRoom && freshRoom.restaurants.length === 0) {
        try {
          const restaurants = await searchRestaurants(
            freshRoom.location.lat,
            freshRoom.location.lng,
            50,
          );
          setRoomRestaurants(roomId, restaurants);
          io.to(roomId).emit("room-ready", {
            restaurants: restaurants.length,
            restaurantData: restaurants,
          });
        } catch (error) {
          console.error("Failed to fetch restaurants:", error);
          socket.emit("error", { message: "Failed to load restaurants" });
        }
      } else if (freshRoom && freshRoom.restaurants.length > 0) {
        socket.emit("room-ready", {
          restaurants: freshRoom.restaurants.length,
          restaurantData: freshRoom.restaurants,
        });
      }

      console.log(`User ${userId} joined room ${roomId}`);
    });

    /**
     * Swipe event: records user choice and broadcasts matches or partner actions.
     */
    socket.on("swipe", (data: {
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

      socket.to(roomId).emit("partner-swiped", { restaurantId, direction });

      if (result.isMatch) {
        const room = getRoomById(roomId);
        const restaurant = room?.restaurants.find((r: { id: string }) => r.id === restaurantId);

        io.to(roomId).emit("match-found", {
          restaurantId,
          restaurantName: restaurant?.name || "Restaurant",
          restaurant,
        });
      }
    });

    socket.on("leave-room", (data: { roomId: string; userId: string }) => {
      leaveRoom(socket, data.userId, data.roomId);
    });

    socket.on("disconnect", () => {
      const userId = userSockets.get(socket.id);
      const roomId = userId ? userRooms.get(userId) : null;

      if (userId && roomId) {
        leaveRoom(socket, userId, roomId);
      }
      console.log(`Disconnected: ${socket.id}`);
    });
  });

  /**
   * Utility to handle user leaving a room and cleanup session data.
   */
  function leaveRoom(socket: Socket, userId: string, roomId: string) {
    removeUserFromRoom(roomId, userId);
    socket.leave(roomId);
    socket.to(roomId).emit("partner-disconnected", { partnerId: userId });
    userSockets.delete(socket.id);
    userRooms.delete(userId);
  }

  httpServer.listen(port, () => {
    console.log(`> Server ready on http://${hostname}:${port}`);
  });
});

