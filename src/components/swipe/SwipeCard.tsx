"use client";

import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { Restaurant } from "@/types";
import Image from "next/image";
import { MapPin, Star } from "lucide-react";

interface SwipeCardProps {
  restaurant: Restaurant;
  onSwipe: (direction: "left" | "right") => void;
  isTop: boolean;
}

export default function SwipeCard({
  restaurant,
  onSwipe,
  isTop,
}: SwipeCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(
    x,
    [-200, -100, 0, 100, 200],
    [0.5, 1, 1, 1, 0.5],
  );

  // Like/Dislike indicator opacity
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const dislikeOpacity = useTransform(x, [-100, 0], [1, 0]);

  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    const threshold = 100;
    const velocity = info.velocity.x;
    const offset = info.offset.x;

    if (offset > threshold || velocity > 500) {
      onSwipe("right");
    } else if (offset < -threshold || velocity < -500) {
      onSwipe("left");
    }
  };

  const gradient =
    restaurant.gradient ||
    "linear-gradient(135deg, #37474f 0%, #263238 50%, #1a1a2e 100%)";
  const emoji = restaurant.emoji || "🍽️";

  return (
    <motion.div
      className="absolute w-full h-full cursor-grab active:cursor-grabbing"
      style={{
        x: isTop ? x : 0,
        rotate: isTop ? rotate : 0,
        opacity: isTop ? opacity : 1,
        zIndex: isTop ? 10 : 1,
      }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      onDragEnd={handleDragEnd}
      whileTap={isTop ? { scale: 1.02 } : undefined}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: isTop ? 1 : 0.95, opacity: 1 }}
      exit={{
        x: x.get() > 0 ? 300 : -300,
        opacity: 0,
        transition: { duration: 0.3 },
      }}
    >
      <div
        className="relative w-full h-full rounded-2xl overflow-hidden border border-bg-tertiary shadow-2xl"
        style={{ backgroundColor: "#1a1a1a" }}
      >
        {/* Restaurant Background — Gradient + Icon */}
        <div className="absolute inset-0" style={{ background: gradient }}>
          {/* Decorative pattern overlay */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 20% 80%, rgba(255,255,255,0.06) 0%, transparent 50%),
                               radial-gradient(circle at 80% 20%, rgba(255,255,255,0.04) 0%, transparent 50%)`,
            }}
          />
          {/* Large emoji as visual anchor */}
          <div className="absolute inset-0 flex items-center justify-center opacity-20">
            <span style={{ fontSize: "180px", lineHeight: 1 }}>{emoji}</span>
          </div>
          {/* Foursquare category icon */}
          <div className="absolute top-6 right-6 w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/10">
            <Image
              src={restaurant.image}
              alt={restaurant.cuisine}
              width={48}
              height={48}
              className="object-contain"
              unoptimized
            />
          </div>
          {/* Gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
        </div>

        {/* Like/Dislike Indicators */}
        <motion.div
          className="absolute top-8 right-8 px-4 py-2 bg-accent-primary text-bg-primary font-bold text-2xl rounded-xl border-4 border-accent-primary rotate-12 z-10"
          style={{ opacity: likeOpacity }}
        >
          LIKE
        </motion.div>
        <motion.div
          className="absolute top-8 left-8 px-4 py-2 bg-accent-error text-white font-bold text-2xl rounded-xl border-4 border-accent-error -rotate-12 z-10"
          style={{ opacity: dislikeOpacity }}
        >
          NOPE
        </motion.div>

        {/* Restaurant Info */}
        <div
          className="absolute bottom-0 left-0 right-0 p-6 z-10"
          style={{ visibility: isTop ? "visible" : "hidden" }}
        >
          {/* Cuisine Tag */}
          <div className="inline-flex items-center gap-2 bg-accent-secondary/20 backdrop-blur-sm px-3 py-1 rounded-full mb-3">
            <span className="text-accent-secondary text-sm font-medium">
              {restaurant.cuisine}
            </span>
            {restaurant.priceLevel && (
              <>
                <span className="text-text-muted">•</span>
                <span className="text-accent-primary text-sm font-medium">
                  {restaurant.priceLevel}
                </span>
              </>
            )}
          </div>

          {/* Restaurant Name */}
          <h2 className="text-3xl font-bold text-white mb-2">
            {restaurant.name}
          </h2>

          {/* Description */}
          <p className="text-text-secondary text-sm mb-3">
            {restaurant.description}
          </p>

          {/* Address */}
          <div className="flex items-center gap-2 text-text-muted text-sm">
            <MapPin className="w-4 h-4" />
            <span className="truncate">{restaurant.address}</span>
          </div>

          {/* Rating */}
          {restaurant.rating && (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1 bg-accent-primary/20 px-2 py-1 rounded-lg">
                <Star
                  className="w-4 h-4 text-accent-primary"
                  fill="currentColor"
                  strokeWidth={0}
                />
                <span className="text-accent-primary font-semibold text-sm">
                  {restaurant.rating.toFixed(1)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
