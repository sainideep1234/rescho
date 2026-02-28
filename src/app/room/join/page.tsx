"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui";
import Link from "next/link";
import { v4 as uuidv4 } from "uuid";
import { ChevronLeft } from "lucide-react";

export default function JoinRoomPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCodeChange = (value: string) => {
    // Only allow alphanumeric and convert to uppercase
    const cleaned = value.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    if (cleaned.length <= 6) {
      setCode(cleaned);
    }
    setError("");
  };

  const joinRoom = async () => {
    if (code.length !== 6) {
      setError("Please enter a 6-character room code");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const userId = uuidv4();

      const response = await fetch("/api/rooms/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to join room");
      }

      // Store session data
      sessionStorage.setItem("rescho_user_id", userId);
      sessionStorage.setItem("rescho_room_id", data.roomId);
      sessionStorage.setItem("rescho_room_code", code);
      sessionStorage.setItem("rescho_location", JSON.stringify(data.location));

      // Navigate to swipe page
      router.push(`/room/${data.roomId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join room");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-accent-secondary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 left-1/4 w-96 h-96 bg-accent-primary/5 rounded-full blur-3xl" />
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
        >
          <h1 className="text-3xl font-bold mb-2">
            Join a <span className="text-accent-secondary">Room</span>
          </h1>
          <p className="text-text-secondary mb-8">
            Enter the 6-character code from your partner
          </p>

          {/* Code Input */}
          <div className="mb-6">
            <div className="bg-bg-secondary rounded-2xl border border-bg-tertiary p-4 focus-within:border-accent-secondary/50 transition-colors">
              <input
                type="text"
                value={code}
                onChange={(e) => handleCodeChange(e.target.value)}
                placeholder="XXXXXX"
                className="w-full bg-transparent text-4xl font-mono font-bold text-center tracking-[0.3em] text-text-primary placeholder:text-text-muted focus:outline-none"
                autoComplete="off"
                autoCapitalize="characters"
              />
            </div>
            <p className="text-text-muted text-xs text-center mt-2">
              {code.length}/6 characters
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-accent-error/10 border border-accent-error/30 rounded-xl p-3 mb-6 text-accent-error text-sm text-center"
            >
              {error}
            </motion.div>
          )}

          {/* Join Button */}
          <Button
            variant="secondary"
            size="lg"
            onClick={joinRoom}
            disabled={code.length !== 6 || isLoading}
            isLoading={isLoading}
            className="w-full mb-4"
          >
            Join Room
          </Button>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-bg-tertiary" />
            <span className="text-text-muted text-sm">or</span>
            <div className="flex-1 h-px bg-bg-tertiary" />
          </div>

          {/* Create Room Link */}
          <Link href="/room/create" className="block">
            <Button variant="ghost" className="w-full">
              Create a new room instead
            </Button>
          </Link>
        </motion.div>
      </div>
    </main>
  );
}
