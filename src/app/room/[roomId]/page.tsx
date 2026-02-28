"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { SwipeStack, MatchModal } from "@/components/swipe";
import { Button } from "@/components/ui";
import { Restaurant } from "@/types";
import Link from "next/link";
import {
  X,
  Heart,
  User,
  Plus,
  Eye,
  AlertTriangle,
  Wifi,
  WifiOff,
} from "lucide-react";

interface MatchData {
  restaurantId: string;
  restaurantName: string;
  restaurant: Restaurant;
}

// Poll state from server every 2.5 seconds
const POLL_INTERVAL = 2500;
// On match check, poll faster for responsiveness
const MATCH_POLL_INTERVAL = 1500;

export default function SwipePage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [matches, setMatches] = useState<Restaurant[]>([]);
  const [seenMatchIds, setSeenMatchIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [partnerConnected, setPartnerConnected] = useState(false);
  const [roomCode, setRoomCode] = useState("");
  const [swipeCount, setSwipeCount] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState("Connecting to room...");

  // Match modal state
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [currentMatch, setCurrentMatch] = useState<Restaurant | null>(null);

  // Matches drawer state
  const [showMatches, setShowMatches] = useState(false);

  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const matchPollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const initDoneRef = useRef(false);
  const restaurantsLoadedRef = useRef(false);
  const userIdRef = useRef<string | null>(null);

  // ─────────────────────────────────────────────────────────────
  // Core state poll — loads restaurants, partner status, matches
  // ─────────────────────────────────────────────────────────────
  const pollRoomState = useCallback(async () => {
    const userId = userIdRef.current;
    if (!userId || !roomId) return;

    try {
      const res = await fetch(
        `/api/rooms/${roomId}/state?userId=${encodeURIComponent(userId)}`,
        { cache: "no-store" },
      );

      if (!res.ok) {
        if (res.status === 404) {
          setError("Room not found. It may have expired.");
          setIsLoading(false);
          return;
        }
        setIsConnected(false);
        return;
      }

      const data = await res.json();
      setIsConnected(true);

      // Update partner status
      setPartnerConnected(data.partnerConnected);

      // Set room code once
      if (data.code && !roomCode) {
        setRoomCode(data.code);
      }

      // Load restaurants once (first time they're available)
      if (!restaurantsLoadedRef.current && data.restaurants?.length > 0) {
        setRestaurants(data.restaurants);
        restaurantsLoadedRef.current = true;
        setIsLoading(false);
        setIsConnected(true);
      }

      // Detect NEW matches (avoid showing modal for already-seen matches)
      if (data.matches?.length > 0) {
        const newMatchIds = data.matches.filter(
          (id: string) => !seenMatchIds.has(id),
        );
        if (newMatchIds.length > 0) {
          // Find restaurant objects for new matches
          const allRestaurants: Restaurant[] =
            restaurants.length > 0 ? restaurants : data.restaurants || [];
          for (const matchId of newMatchIds) {
            const matchedRestaurant = allRestaurants.find(
              (r) => r.id === matchId,
            );
            if (matchedRestaurant) {
              setCurrentMatch(matchedRestaurant);
              setMatches((prev) => {
                if (prev.some((r) => r.id === matchId)) return prev;
                return [...prev, matchedRestaurant];
              });
              setShowMatchModal(true);
            }
          }
          setSeenMatchIds((prev) => {
            const updated = new Set(prev);
            newMatchIds.forEach((id: string) => updated.add(id));
            return updated;
          });
        }
      }
    } catch {
      setIsConnected(false);
    }
  }, [roomId, roomCode, seenMatchIds, restaurants]);

  // ─────────────────────────────────────────────────────────────
  // Initialization
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (initDoneRef.current) return;
    initDoneRef.current = true;

    const userId = sessionStorage.getItem("rescho_user_id");
    const storedRoomCode = sessionStorage.getItem("rescho_room_code");

    if (!userId) {
      router.push("/");
      return;
    }

    userIdRef.current = userId;
    if (storedRoomCode) setRoomCode(storedRoomCode);

    // Load cached restaurants instantly for creator
    const isCreator = sessionStorage.getItem("rescho_is_creator") === "true";
    const cachedRestaurants = sessionStorage.getItem("rescho_restaurants");
    if (isCreator && cachedRestaurants) {
      try {
        const parsed = JSON.parse(cachedRestaurants) as Restaurant[];
        if (parsed.length > 0) {
          setRestaurants(parsed);
          restaurantsLoadedRef.current = true;
          setIsLoading(false);
        }
      } catch {
        // ignore corrupt cache
      }
    }

    // Show loading message progression for joiner
    if (!isCreator) {
      const msgs = [
        "Connecting to room...",
        "Loading restaurant list...",
        "Almost ready...",
      ];
      let idx = 0;
      const msgTimer = setInterval(() => {
        idx = (idx + 1) % msgs.length;
        setLoadingMessage(msgs[idx]);
      }, 1800);
      setTimeout(() => clearInterval(msgTimer), 12000);
    }

    // Start polling immediately
    pollRoomState();
  }, [router, pollRoomState]);

  // ─────────────────────────────────────────────────────────────
  // Polling intervals — start after init, keep alive
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    // Don't start polling until we have a userId
    if (!userIdRef.current) return;

    pollTimerRef.current = setInterval(pollRoomState, POLL_INTERVAL);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      if (matchPollTimerRef.current) clearInterval(matchPollTimerRef.current);
    };
  }, [pollRoomState]);

  // ─────────────────────────────────────────────────────────────
  // Swipe handler — POST to REST API, poll faster for matches
  // ─────────────────────────────────────────────────────────────
  const handleSwipe = useCallback(
    async (restaurantId: string, direction: "left" | "right") => {
      const userId = userIdRef.current;
      if (!userId) return;

      setSwipeCount((prev) => prev + 1);

      try {
        const res = await fetch("/api/rooms/swipe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomId, userId, restaurantId, direction }),
        });

        if (!res.ok) return;

        const data = await res.json();

        // If it's a match, immediately update UI without waiting for next poll
        if (data.isMatch && data.matchedRestaurant) {
          const matchId = data.matchedRestaurant.id;
          if (!seenMatchIds.has(matchId)) {
            setCurrentMatch(data.matchedRestaurant);
            setMatches((prev) => {
              if (prev.some((r) => r.id === matchId)) return prev;
              return [...prev, data.matchedRestaurant];
            });
            setShowMatchModal(true);
            setSeenMatchIds((prev) => new Set(prev).add(matchId));
          }
        }

        // Also poll immediately after a right-swipe to catch the partner's match
        if (direction === "right") {
          setTimeout(pollRoomState, 300);
          setTimeout(pollRoomState, 1200);
        }
      } catch (err) {
        console.error("Swipe failed:", err);
      }
    },
    [roomId, seenMatchIds, pollRoomState],
  );

  const handleLeaveRoom = () => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    if (matchPollTimerRef.current) clearInterval(matchPollTimerRef.current);
    sessionStorage.removeItem("rescho_room_id");
    sessionStorage.removeItem("rescho_room_code");
    sessionStorage.removeItem("rescho_is_creator");
    sessionStorage.removeItem("rescho_restaurants");
    router.push("/");
  };

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-bg-primary">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center px-6"
        >
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-bg-tertiary" />
            <div className="absolute inset-0 rounded-full border-4 border-accent-primary border-t-transparent animate-spin" />
          </div>
          <motion.p
            key={loadingMessage}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-text-secondary text-base"
          >
            {loadingMessage}
          </motion.p>
          <p className="text-text-muted text-xs mt-2">
            This may take a few seconds on first load
          </p>
        </motion.div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 bg-bg-primary">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-accent-error/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-accent-error" />
          </div>
          <h2 className="text-text-primary font-semibold mb-2">
            Something went wrong
          </h2>
          <p className="text-accent-error mb-6 text-sm">{error}</p>
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
        {/* Left spacer to keep room code centred */}
        <div className="w-10" />

        <div className="text-center">
          <div className="text-xs text-text-muted">Room Code</div>
          <div className="font-mono font-bold text-accent-primary text-lg tracking-widest">
            {roomCode}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Connection indicator */}
          <div className="flex items-center gap-1.5">
            {isConnected ? (
              <Wifi className="w-3.5 h-3.5 text-accent-primary" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-accent-error animate-pulse" />
            )}
          </div>

          {/* Matches button */}
          <button
            onClick={() => setShowMatches(true)}
            className="relative p-2 text-text-secondary hover:text-accent-primary transition-colors"
          >
            <Heart className="w-6 h-6" fill="currentColor" strokeWidth={0} />
            {matches.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent-primary text-white text-xs font-bold rounded-full flex items-center justify-center">
                {matches.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Partner Status */}
      <div className="px-4 py-2.5 bg-bg-secondary border-b border-bg-tertiary">
        <div className="flex items-center justify-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-accent-primary/20 flex items-center justify-center">
              <User className="w-4 h-4 text-accent-primary" />
            </div>
            <span className="text-sm text-text-primary font-medium">You</span>
          </div>

          <motion.div
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-text-muted text-lg tracking-widest"
          >
            •••
          </motion.div>

          <div className="flex items-center gap-2">
            <AnimatePresence mode="wait">
              {partnerConnected ? (
                <motion.div
                  key="connected"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="w-8 h-8 rounded-full bg-accent-secondary/20 flex items-center justify-center"
                >
                  <User className="w-4 h-4 text-accent-secondary" />
                </motion.div>
              ) : (
                <motion.div
                  key="waiting"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="w-8 h-8 rounded-full bg-bg-tertiary border-2 border-dashed border-text-muted flex items-center justify-center"
                >
                  <Plus className="w-4 h-4 text-text-muted" />
                </motion.div>
              )}
            </AnimatePresence>
            <span
              className={`text-sm font-medium ${
                partnerConnected ? "text-text-primary" : "text-text-muted"
              }`}
            >
              {partnerConnected ? "Partner ✓" : "Waiting..."}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="flex items-center justify-center gap-6 px-4 py-2 text-sm border-b border-bg-tertiary/50">
        <div className="flex items-center gap-1.5 text-text-secondary">
          <Eye className="w-4 h-4" />
          <span>{swipeCount} viewed</span>
        </div>
        <div className="flex items-center gap-1.5 text-accent-primary">
          <Heart className="w-4 h-4" fill="currentColor" strokeWidth={0} />
          <span>{matches.length} matches</span>
        </div>
      </div>

      {/* Swipe Area */}
      <div className="flex-1 px-4 py-4 overflow-hidden">
        <SwipeStack
          restaurants={restaurants}
          onSwipe={handleSwipe}
          matchCount={matches.length}
        />
      </div>

      {/* Footer Attribution */}
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
                  Matches ({matches.length})
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
                  <p className="text-text-secondary font-medium">
                    No matches yet!
                  </p>
                  <p className="text-text-muted text-sm mt-1">
                    Keep swiping to find restaurants you both like.
                  </p>
                </div>
              ) : (
                <div className="p-4 space-y-4">
                  {matches.map((restaurant) => (
                    <motion.div
                      key={restaurant.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
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
                        {restaurant.priceLevel && (
                          <p className="text-xs text-accent-primary font-medium mt-0.5">
                            {restaurant.priceLevel}
                          </p>
                        )}
                        <p className="text-xs text-text-muted mt-1 truncate">
                          {restaurant.address}
                        </p>
                      </div>
                    </motion.div>
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
