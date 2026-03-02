// ─────────────────────────────────────────────────────────────────────────────
// src/lib/socket/client.ts — Browser-side Socket.IO helpers.
//
// Socket.IO lets the browser and server talk to each other in real-time
// (without the browser having to keep refreshing the page).
//
// This file creates ONE shared socket connection that the whole app can use.
// Creating multiple connections for the same user would waste resources.
// ─────────────────────────────────────────────────────────────────────────────

"use client"; // This directive tells Next.js this file only runs in the browser.

import { io, Socket } from "socket.io-client";

// We store the socket in a module-level variable so we only ever create one.
// null means "not created yet".
let socket: Socket | null = null;

// ─────────────────────────────────────────────────────────────────────────────
// getSocket
//
// Returns the shared socket instance, creating it on the first call.
// Subsequent calls return the same object (this is called a "singleton").
// ─────────────────────────────────────────────────────────────────────────────
export function getSocket(): Socket {
  if (!socket) {
    // The server URL comes from the environment file.
    // Fall back to localhost if running on a developer's machine.
    const serverUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000";

    socket = io(serverUrl, {
      path: "/api/socketio", // Must match the path set in server/index.ts.
      autoConnect: false, // Don't connect automatically — we'll do it manually.
      reconnection: true, // If the connection drops, try to reconnect.
      reconnectionAttempts: 5, // Give up after 5 failed attempts.
      reconnectionDelay: 1000, // Wait 1 second between each attempt.
    });
  }

  return socket;
}

// ─────────────────────────────────────────────────────────────────────────────
// connectSocket
//
// Connects to the server (if not already connected) and returns the socket.
// Call this when the user enters a room page.
// ─────────────────────────────────────────────────────────────────────────────
export function connectSocket(): Socket {
  const sock = getSocket();

  if (!sock.connected) {
    sock.connect();
  }

  return sock;
}

// ─────────────────────────────────────────────────────────────────────────────
// disconnectSocket
//
// Cleanly closes the connection when the user leaves.
// ─────────────────────────────────────────────────────────────────────────────
export function disconnectSocket(): void {
  if (socket?.connected) {
    socket.disconnect();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// isSocketConnected
//
// Returns true if the socket is currently connected, false otherwise.
// The "??" is the "nullish coalescing" operator — it returns the right side
// (false) if the left side is null or undefined.
// ─────────────────────────────────────────────────────────────────────────────
export function isSocketConnected(): boolean {
  return socket?.connected ?? false;
}
