"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui";
import Link from "next/link";
import { v4 as uuidv4 } from "uuid";
import {
  ChevronLeft,
  AlertTriangle,
  Check,
  Copy,
  MapPin,
  User,
  Plus,
} from "lucide-react";

interface LocationData {
  lat: number;
  lng: number;
  name: string;
}

export default function CreateRoomPage() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [location, setLocation] = useState<LocationData | null>(null);

  useEffect(() => {
    // Get location from sessionStorage or redirect to location page
    const storedLocation = sessionStorage.getItem("rescho_location");

    if (!storedLocation) {
      router.push("/location?mode=create");
      return;
    }

    const locationData = JSON.parse(storedLocation) as LocationData;
    setLocation(locationData);

    // Create room first, then pre-fetch restaurants and register them with the room
    initializeRoom(locationData);
  }, [router]);

  const initializeRoom = async (loc: LocationData) => {
    try {
      // Step 1: Create the room
      const response = await fetch("/api/rooms/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location: loc }),
      });

      if (!response.ok) {
        throw new Error("Failed to create room");
      }

      const data = await response.json();
      setRoomCode(data.code);
      setRoomId(data.roomId);

      // Store session data
      const userId = uuidv4();
      sessionStorage.setItem("rescho_user_id", userId);
      sessionStorage.setItem("rescho_room_id", data.roomId);
      sessionStorage.setItem("rescho_room_code", data.code);

      setIsLoading(false);

      // Step 2: Pre-fetch restaurants and register with room (in background)
      prefetchAndRegisterRestaurants(loc, data.roomId);
    } catch (err) {
      console.error(err);
      setError("Failed to create room. Please try again.");
      setIsLoading(false);
    }
  };

  // Pre-fetch restaurants AND register them with the room for server-side match detection
  const prefetchAndRegisterRestaurants = async (
    loc: LocationData,
    createdRoomId: string,
  ) => {
    try {
      const response = await fetch(
        `/api/restaurants?lat=${loc.lat}&lng=${loc.lng}&limit=15`,
      );
      const data = await response.json();
      if (data.restaurants && data.restaurants.length > 0) {
        // Cache locally for instant load on swipe page
        sessionStorage.setItem(
          "rescho_restaurants",
          JSON.stringify(data.restaurants),
        );

        // Register restaurants with the room on the server (for match detection)
        await fetch(`/api/rooms/${createdRoomId}/matches`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ restaurants: data.restaurants }),
        });
      }
    } catch (err) {
      console.error(
        "Pre-fetch restaurants failed (will retry on swipe page):",
        err,
      );
    }
  };

  const copyCode = async () => {
    if (!roomCode) return;

    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = roomCode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const startSwiping = () => {
    if (roomId) {
      router.push(`/room/${roomId}`);
    }
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
          <p className="text-text-secondary">Creating your room...</p>
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
          <Button variant="primary" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-accent-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-accent-secondary/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary mb-8 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          Back
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h1 className="text-3xl font-bold mb-2">
            Room <span className="text-accent-primary">Created!</span>
          </h1>
          <p className="text-text-secondary mb-8">
            Share this code with your partner to join
          </p>

          {/* Room Code Display */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-bg-secondary rounded-2xl border border-accent-primary/30 p-8 mb-6"
          >
            <div className="text-5xl font-mono font-bold tracking-[0.3em] text-accent-primary mb-4">
              {roomCode}
            </div>
            <Button
              variant="ghost"
              onClick={copyCode}
              className="text-text-secondary hover:text-accent-primary"
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5 mr-2" />
                  Copy Code
                </>
              )}
            </Button>
          </motion.div>

          {/* Location Info */}
          {location && (
            <div className="flex items-center justify-center gap-2 text-sm text-text-secondary mb-8">
              <MapPin className="w-4 h-4" />
              <span>{location.name}</span>
            </div>
          )}

          {/* Waiting Animation */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-accent-primary/20 flex items-center justify-center">
                <User className="w-6 h-6 text-accent-primary" />
              </div>
              <motion.div
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-text-muted"
              >
                • • •
              </motion.div>
              <div className="w-12 h-12 rounded-full bg-bg-tertiary border-2 border-dashed border-text-muted flex items-center justify-center">
                <Plus className="w-6 h-6 text-text-muted" />
              </div>
            </div>
            <p className="text-text-secondary text-sm">
              Waiting for partner to join...
            </p>
          </motion.div>

          {/* Start Button (for testing without partner) */}
          <Button
            variant="primary"
            size="lg"
            onClick={startSwiping}
            className="w-full"
          >
            Start Swiping
          </Button>
          <p className="text-text-muted text-xs mt-2">
            Or wait for your partner to join
          </p>
        </motion.div>
      </div>
    </main>
  );
}
