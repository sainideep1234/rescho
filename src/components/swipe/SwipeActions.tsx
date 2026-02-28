"use client";

import { motion } from "framer-motion";
import { X, Heart } from "lucide-react";

interface SwipeActionsProps {
  onSwipe: (direction: "left" | "right") => void;
}

export default function SwipeActions({ onSwipe }: SwipeActionsProps) {
  return (
    <div className="flex items-center justify-center gap-8 py-5">
      {/* Dislike Button */}
      <motion.button
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.85 }}
        onClick={() => onSwipe("left")}
        className="swipe-btn-dislike"
      >
        <X className="w-8 h-8" strokeWidth={2.5} />
      </motion.button>

      {/* Like Button */}
      <motion.button
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.85 }}
        onClick={() => onSwipe("right")}
        className="swipe-btn-like"
      >
        <Heart className="w-8 h-8" strokeWidth={0} fill="currentColor" />
      </motion.button>
    </div>
  );
}
