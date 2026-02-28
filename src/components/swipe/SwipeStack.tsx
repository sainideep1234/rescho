"use client";

import { useState, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { Restaurant } from "@/types";
import SwipeCard from "./SwipeCard";
import SwipeActions from "./SwipeActions";
import { Frown } from "lucide-react";

interface SwipeStackProps {
  restaurants: Restaurant[];
  onSwipe: (restaurantId: string, direction: "left" | "right") => void;
  onEmpty?: () => void;
}

export default function SwipeStack({
  restaurants,
  onSwipe,
  onEmpty,
}: SwipeStackProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleSwipe = useCallback(
    (direction: "left" | "right") => {
      if (currentIndex >= restaurants.length) return;

      const restaurant = restaurants[currentIndex];
      onSwipe(restaurant.id, direction);

      setCurrentIndex((prev) => {
        const newIndex = prev + 1;
        if (newIndex >= restaurants.length && onEmpty) {
          setTimeout(onEmpty, 500);
        }
        return newIndex;
      });
    },
    [currentIndex, restaurants, onSwipe, onEmpty],
  );

  // Show only top 3 cards for performance
  const visibleCards = restaurants
    .slice(currentIndex, currentIndex + 3)
    .reverse();

  if (currentIndex >= restaurants.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-4">
        <div className="w-20 h-20 rounded-full bg-bg-secondary flex items-center justify-center mb-4">
          <Frown className="w-10 h-10 text-text-muted" />
        </div>
        <h3 className="text-xl font-semibold text-text-primary mb-2">
          No more restaurants!
        </h3>
        <p className="text-text-secondary text-sm">
          You&apos;ve seen all available options in this area.
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Card Stack */}
      <div className="relative flex-1 min-h-[400px] max-h-[500px] mx-auto w-full max-w-sm">
        <AnimatePresence mode="sync">
          {visibleCards.map((restaurant, index) => (
            <SwipeCard
              key={restaurant.id}
              restaurant={restaurant}
              onSwipe={handleSwipe}
              isTop={index === visibleCards.length - 1}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Progress */}
      <div className="text-center my-4">
        <span className="text-text-muted text-sm">
          {currentIndex + 1} / {restaurants.length}
        </span>
      </div>

      {/* Action Buttons */}
      <SwipeActions onSwipe={handleSwipe} />
    </div>
  );
}
