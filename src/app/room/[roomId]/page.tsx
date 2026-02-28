"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { SwipeStack, MatchModal } from "@/components/swipe";
import { Button } from "@/components/ui";
import { Restaurant } from "@/types";
import { connectSocket, disconnectSocket, SOCKET_EVENTS } from "@/lib/socket";
import Link from "next/link";
import { X, Heart, User, Plus, Eye, AlertTriangle } from "lucide-react";

interface MatchData {
  restaurantId: string;
  restaurantName: string;
  restaurant: Restaurant;
}

export default function SwipePage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;
  const initializedRef = useRef(false);

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [matches, setMatches] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [partnerConnected, setPartnerConnected] = useState(false);
  const [roomCode, setRoomCode] = useState("");
  const [swipeCount, setSwipeCount] = useState(0);

  // Match modal state
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [currentMatch, setCurrentMatch] = useState<Restaurant | null>(null);

  // Show matches drawer
  const [showMatches, setShowMatches] = useState(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    // Get session data
    const userId = sessionStorage.getItem("rescho_user_id");
    const storedRoomCode = sessionStorage.getItem("rescho_room_code");
    const locationStr = sessionStorage.getItem("rescho_location");
    const cachedRestaurants = sessionStorage.getItem("rescho_restaurants");

    if (!userId) {
      router.push("/");
      return;
    }

    // Set room code from session (async-safe)
    if (storedRoomCode) {
      setTimeout(() => setRoomCode(storedRoomCode), 0);
    }

    // INSTANT LOAD: Try cached restaurants first (pre-fetched on create page)
    let loadedFromCache = false;
    if (cachedRestaurants) {
      try {
        const parsed = JSON.parse(cachedRestaurants) as Restaurant[];
        if (parsed.length > 0) {
          setRestaurants(parsed);
          setIsLoading(false);
          loadedFromCache = true;
        }
      } catch {
        // Cache corrupted, will fetch fresh
      }
    }

    // Connect to socket for real-time features (matches, partner status)
    const socket = connectSocket();

    socket.on("connect", () => {
      setIsConnected(true);
      socket.emit(SOCKET_EVENTS.JOIN_ROOM, { roomId, userId });
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on(
      SOCKET_EVENTS.ROOM_READY,
      (data: { restaurants: number; restaurantData: Restaurant[] }) => {
        // Only update if we didn't already load from cache or if socket has more data
        if (!loadedFromCache || data.restaurantData.length > 0) {
          setRestaurants(data.restaurantData);
          setIsLoading(false);
        }
      },
    );

    socket.on(SOCKET_EVENTS.PARTNER_JOINED, () => {
      setPartnerConnected(true);
    });

    socket.on(SOCKET_EVENTS.PARTNER_DISCONNECTED, () => {
      setPartnerConnected(false);
    });

    socket.on(SOCKET_EVENTS.MATCH_FOUND, (data: MatchData) => {
      setCurrentMatch(data.restaurant);
      setMatches((prev) => [...prev, data.restaurant]);
      setShowMatchModal(true);
    });

    socket.on(SOCKET_EVENTS.ERROR, (data: { message: string }) => {
      setError(data.message);
      setIsLoading(false);
    });

    // IMMEDIATE fallback: If no cache, fetch via API right away (no 3s delay)
    if (!loadedFromCache && locationStr) {
      (async () => {
        try {
          const location = JSON.parse(locationStr);
          const response = await fetch(
            `/api/restaurants?lat=${location.lat}&lng=${location.lng}&limit=15`,
          );
          const data = await response.json();
          if (data.restaurants && data.restaurants.length > 0) {
            setRestaurants(data.restaurants);
            // Cache for subsequent visits
            sessionStorage.setItem(
              "rescho_restaurants",
              JSON.stringify(data.restaurants),
            );
          }
        } catch (err) {
          console.error("Failed to fetch restaurants:", err);
        }
        setIsLoading(false);
      })();
    }

    return () => {
      disconnectSocket();
    };
  }, [roomId, router]);

  const handleSwipe = useCallback(
    (restaurantId: string, direction: "left" | "right") => {
      const userId = sessionStorage.getItem("rescho_user_id");
      if (!userId) return;

      setSwipeCount((prev) => prev + 1);

      const socket = connectSocket();
      socket.emit(SOCKET_EVENTS.SWIPE, {
        roomId,
        userId,
        restaurantId,
        direction,
      });
    },
    [roomId],
  );

  const handleLeaveRoom = () => {
    const userId = sessionStorage.getItem("rescho_user_id");
    if (userId) {
      const socket = connectSocket();
      socket.emit(SOCKET_EVENTS.LEAVE_ROOM, { roomId, userId });
    }
    sessionStorage.removeItem("rescho_room_id");
    sessionStorage.removeItem("rescho_room_code");
    router.push("/");
  };

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-accent-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">Loading restaurants...</p>
        </motion.div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-accent-error/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-accent-error" />
          </div>
          <p className="text-accent-error mb-4">{error}</p>
          <Link href="/">
            <Button variant="primary">Go Home</Button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col bg-bg-primary">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-bg-tertiary">
        <button
          onClick={handleLeaveRoom}
          className="text-text-secondary hover:text-text-primary transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center">
          <div className="text-xs text-text-muted">Room Code</div>
          <div className="font-mono font-bold text-accent-primary">
            {roomCode}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Connection Status */}
          <div
            className={`w-2 h-2 rounded-full ${isConnected ? "bg-accent-primary" : "bg-accent-error"}`}
          />

          {/* Matches Button */}
          <button
            onClick={() => setShowMatches(true)}
            className="relative p-2 text-text-secondary hover:text-accent-primary transition-colors"
          >
            <Heart className="w-6 h-6" fill="currentColor" strokeWidth={0} />
            {matches.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent-primary text-bg-primary text-xs font-bold rounded-full flex items-center justify-center">
                {matches.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Partner Status */}
      <div className="px-4 py-2 bg-bg-secondary border-b border-bg-tertiary">
        <div className="flex items-center justify-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-accent-primary/20 flex items-center justify-center">
              <User className="w-4 h-4 text-accent-primary" />
            </div>
            <span className="text-sm text-text-primary">You</span>
          </div>

          <motion.div
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-text-muted"
          >
            •••
          </motion.div>

          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                partnerConnected
                  ? "bg-accent-secondary/20"
                  : "bg-bg-tertiary border-2 border-dashed border-text-muted"
              }`}
            >
              {partnerConnected ? (
                <User className="w-4 h-4 text-accent-secondary" />
              ) : (
                <Plus className="w-4 h-4 text-text-muted" />
              )}
            </div>
            <span
              className={`text-sm ${partnerConnected ? "text-text-primary" : "text-text-muted"}`}
            >
              {partnerConnected ? "Partner" : "Waiting..."}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="flex items-center justify-center gap-6 px-4 py-2 text-sm">
        <div className="flex items-center gap-1 text-text-secondary">
          <Eye className="w-4 h-4" />
          <span>{swipeCount} viewed</span>
        </div>
        <div className="flex items-center gap-1 text-accent-primary">
          <Heart className="w-4 h-4" fill="currentColor" strokeWidth={0} />
          <span>{matches.length} matches</span>
        </div>
      </div>

      {/* Swipe Area */}
      <div className="flex-1 px-4 py-4 overflow-hidden">
        <SwipeStack restaurants={restaurants} onSwipe={handleSwipe} />
      </div>

      {/* Foursquare Attribution - Required by ToS */}
      <footer className="px-4 py-2 text-center border-t border-bg-tertiary">
        <a
          href="https://foursquare.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-text-muted hover:text-text-secondary transition-colors inline-flex items-center gap-1"
        >
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.727 3.465c-.322-.188-.534-.188-.961-.188H7.13c-.749 0-1.069.32-1.069 1.07v16.653c0 .749.32 1.07 1.07 1.07h.214c.535 0 .749-.214.963-.535l4.172-5.883c.107-.107.214-.214.428-.214h2.033c.642 0 .963-.321 1.07-.856l1.927-10.058c.107-.428-.107-.856-.211-1.059z" />
          </svg>
          Powered by Foursquare
        </a>
      </footer>

      {/* Match Modal */}
      <MatchModal
        isOpen={showMatchModal}
        onClose={() => setShowMatchModal(false)}
        restaurant={currentMatch}
        onContinue={() => setShowMatchModal(false)}
        onViewMatches={() => {
          setShowMatchModal(false);
          setShowMatches(true);
        }}
      />

      {/* Matches Drawer */}
      <AnimatePresence>
        {showMatches && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 z-40"
              onClick={() => setShowMatches(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-bg-secondary z-50 overflow-y-auto"
            >
              <div className="p-4 border-b border-bg-tertiary flex items-center justify-between">
                <h2 className="text-xl font-bold">
                  Your Matches ({matches.length})
                </h2>
                <button
                  onClick={() => setShowMatches(false)}
                  className="text-text-secondary hover:text-text-primary"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {matches.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-bg-tertiary flex items-center justify-center mx-auto mb-4">
                    <Heart className="w-8 h-8 text-text-muted" />
                  </div>
                  <p className="text-text-secondary">No matches yet!</p>
                  <p className="text-text-muted text-sm mt-1">
                    Keep swiping to find restaurants you both like.
                  </p>
                </div>
              ) : (
                <div className="p-4 space-y-4">
                  {matches.map((restaurant) => (
                    <div
                      key={restaurant.id}
                      className="bg-bg-tertiary rounded-xl p-4 flex gap-4"
                    >
                      <div
                        className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 relative flex items-center justify-center"
                        style={{
                          background:
                            restaurant.gradient ||
                            "linear-gradient(135deg, #37474f 0%, #263238 50%, #1a1a2e 100%)",
                        }}
                      >
                        <span style={{ fontSize: "36px", lineHeight: 1 }}>
                          {restaurant.emoji || "🍽️"}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-text-primary truncate">
                          {restaurant.name}
                        </h3>
                        <p className="text-sm text-accent-secondary">
                          {restaurant.cuisine}
                        </p>
                        <p className="text-xs text-text-muted mt-1 truncate">
                          {restaurant.address}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}
