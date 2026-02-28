"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Restaurant } from "@/types";
import { Button } from "@/components/ui";
import { useEffect } from "react";
import { Heart } from "lucide-react";

interface MatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurant: Restaurant | null;
  onContinue: () => void;
  onViewMatches: () => void;
}

// Pre-generated confetti particles (static to avoid impure function calls)
const CONFETTI_COLORS = ["#ff3a5c", "#a855f7", "#06d6a0", "#f0f0f5", "#d4284a"];
const INITIAL_PARTICLES = Array.from({ length: 50 }, (_, i) => ({
  id: i,
  x: (i * 17 + 7) % 100, // Deterministic distribution
  colorIndex: i % 5,
  delay: (i % 10) * 0.05,
}));

// Confetti particle component
function Confetti() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {INITIAL_PARTICLES.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute w-3 h-3 rounded-full"
          style={{
            left: `${particle.x}%`,
            backgroundColor: CONFETTI_COLORS[particle.colorIndex],
          }}
          initial={{ y: "100vh", opacity: 1, rotate: 0 }}
          animate={{ y: "-100vh", opacity: 0, rotate: 720 }}
          transition={{
            duration: 2.5,
            delay: particle.delay,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}

export default function MatchModal({
  isOpen,
  onClose,
  restaurant,
  onContinue,
  onViewMatches,
}: MatchModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && restaurant && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-50"
            onClick={onClose}
          />

          {/* Confetti */}
          <div className="fixed inset-0 z-50 pointer-events-none">
            <Confetti />
          </div>

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="bg-bg-secondary rounded-3xl max-w-sm w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Restaurant Image — Gradient + Emoji */}
              <div
                className="relative h-48 w-full"
                style={{
                  background:
                    restaurant.gradient ||
                    "linear-gradient(135deg, #37474f 0%, #263238 50%, #1a1a2e 100%)",
                }}
              >
                <div className="absolute inset-0 flex items-center justify-center opacity-30">
                  <span style={{ fontSize: "100px", lineHeight: 1 }}>
                    {restaurant.emoji || "🍽️"}
                  </span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-bg-secondary via-transparent to-transparent" />
              </div>

              {/* Content */}
              <div className="p-6 text-center -mt-8 relative">
                {/* Match Badge */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", delay: 0.2 }}
                  className="inline-flex items-center gap-2 bg-accent-primary text-bg-primary px-6 py-2 rounded-full font-bold text-lg mb-4"
                >
                  <Heart
                    className="w-6 h-6"
                    fill="currentColor"
                    strokeWidth={0}
                  />
                  IT&apos;S A MATCH!
                </motion.div>

                {/* Restaurant Name */}
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl font-bold text-text-primary mb-2"
                >
                  {restaurant.name}
                </motion.h2>

                {/* Cuisine & Price */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex items-center justify-center gap-2 text-text-secondary mb-4"
                >
                  <span>{restaurant.cuisine}</span>
                  {restaurant.priceLevel && (
                    <>
                      <span>•</span>
                      <span className="text-accent-primary">
                        {restaurant.priceLevel}
                      </span>
                    </>
                  )}
                </motion.div>

                {/* Address */}
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-text-muted text-sm mb-6"
                >
                  {restaurant.address}
                </motion.p>

                {/* Action Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="flex flex-col gap-3"
                >
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={onViewMatches}
                    className="w-full"
                  >
                    View All Matches
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={onContinue}
                    className="w-full"
                  >
                    Keep Swiping
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
