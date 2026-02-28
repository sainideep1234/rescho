"use client";

import { motion } from "framer-motion";
import { Restaurant } from "@/types";
import Link from "next/link";
import { Heart, Star, MapPin, PartyPopper, Frown } from "lucide-react";

interface SessionResultsProps {
  matches: Restaurant[];
  totalRestaurants: number;
  totalSwiped: number;
  roomCode: string;
}

export default function SessionResults({
  matches,
  totalRestaurants,
  totalSwiped,
  roomCode,
}: SessionResultsProps) {
  const matchRate =
    totalSwiped > 0 ? Math.round((matches.length / totalSwiped) * 100) : 0;

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center pt-10 pb-6 px-4"
      >
        {/* Celebration Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-accent-primary/20 to-accent-secondary/20 flex items-center justify-center"
        >
          <PartyPopper className="w-10 h-10 text-accent-primary" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-bold text-text-primary mb-1"
        >
          Session <span className="text-accent-primary">Complete!</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-text-secondary text-sm"
        >
          Here are the restaurants you both agreed on
        </motion.p>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex justify-center gap-4 px-4 mb-6"
      >
        <div className="bg-bg-secondary rounded-xl px-5 py-3 text-center border border-bg-tertiary">
          <div className="text-2xl font-bold text-accent-primary">
            {matches.length}
          </div>
          <div className="text-xs text-text-muted">Matches</div>
        </div>
        <div className="bg-bg-secondary rounded-xl px-5 py-3 text-center border border-bg-tertiary">
          <div className="text-2xl font-bold text-text-primary">
            {totalSwiped}
          </div>
          <div className="text-xs text-text-muted">Reviewed</div>
        </div>
        <div className="bg-bg-secondary rounded-xl px-5 py-3 text-center border border-bg-tertiary">
          <div className="text-2xl font-bold text-accent-secondary">
            {matchRate}%
          </div>
          <div className="text-xs text-text-muted">Match Rate</div>
        </div>
      </motion.div>

      {/* Matched Restaurants */}
      <div className="flex-1 px-4 pb-6">
        {matches.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-bg-secondary flex items-center justify-center">
              <Frown className="w-8 h-8 text-text-muted" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              No matches this time
            </h3>
            <p className="text-text-secondary text-sm max-w-xs mx-auto">
              You and your partner didn&apos;t agree on any restaurants. Try
              again with a different location!
            </p>
          </motion.div>
        ) : (
          <>
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2"
            >
              <Heart
                className="w-5 h-5 text-accent-primary"
                fill="currentColor"
                strokeWidth={0}
              />
              Your Matched Restaurants
            </motion.h2>

            <div className="space-y-4">
              {matches.map((restaurant, index) => (
                <motion.div
                  key={restaurant.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className="bg-bg-secondary rounded-2xl overflow-hidden border border-bg-tertiary hover:border-accent-primary/30 transition-all duration-300"
                >
                  {/* Restaurant Background — Gradient + Emoji */}
                  <div
                    className="relative w-full h-44"
                    style={{
                      background:
                        restaurant.gradient ||
                        "linear-gradient(135deg, #37474f 0%, #263238 50%, #1a1a2e 100%)",
                    }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center opacity-25">
                      <span style={{ fontSize: "80px", lineHeight: 1 }}>
                        {restaurant.emoji || "🍽️"}
                      </span>
                    </div>
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                    {/* Rating Badge */}
                    {restaurant.rating && (
                      <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm rounded-lg px-2.5 py-1 flex items-center gap-1">
                        <Star
                          className="w-3.5 h-3.5 text-accent-primary"
                          fill="currentColor"
                          strokeWidth={0}
                        />
                        <span className="text-sm font-semibold text-text-primary">
                          {restaurant.rating}
                        </span>
                      </div>
                    )}

                    {/* Match Badge */}
                    <div className="absolute top-3 left-3 bg-accent-primary/90 backdrop-blur-sm rounded-lg px-2.5 py-1 flex items-center gap-1">
                      <Heart
                        className="w-3.5 h-3.5 text-bg-primary"
                        fill="currentColor"
                        strokeWidth={0}
                      />
                      <span className="text-xs font-bold text-bg-primary">
                        MATCH
                      </span>
                    </div>

                    {/* Name over image */}
                    <div className="absolute bottom-3 left-4 right-4">
                      <h3 className="text-xl font-bold text-white mb-0.5">
                        {restaurant.name}
                      </h3>
                    </div>
                  </div>

                  {/* Restaurant Details */}
                  <div className="p-4">
                    <div className="flex items-center gap-3 flex-wrap mb-3">
                      {/* Cuisine Tag */}
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-accent-secondary/15 text-accent-secondary">
                        {restaurant.cuisine}
                      </span>
                      {/* Price Tag */}
                      {restaurant.priceLevel && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-accent-primary/15 text-accent-primary">
                          {restaurant.priceLevel}
                        </span>
                      )}
                      {/* Distance */}
                      {restaurant.distance && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-bg-tertiary text-text-secondary">
                          📍 {(restaurant.distance / 1000).toFixed(1)}km
                        </span>
                      )}
                    </div>

                    {/* Address */}
                    {restaurant.address && (
                      <div className="flex items-start gap-2 text-sm text-text-secondary">
                        <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-text-muted" />
                        <span>{restaurant.address}</span>
                      </div>
                    )}

                    {/* Description */}
                    {restaurant.description && (
                      <p className="text-xs text-text-muted mt-2">
                        {restaurant.description}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Footer Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="sticky bottom-0 p-4 bg-bg-primary/80 backdrop-blur-lg border-t border-bg-tertiary space-y-3"
      >
        <Link href="/" className="block">
          <button className="w-full py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-accent-primary to-[#d4284a] hover:shadow-[0_8px_32px_rgba(255,58,92,0.3)] transition-all duration-300">
            Start New Session
          </button>
        </Link>
        <div className="text-center">
          <span className="text-xs text-text-muted">Room: {roomCode}</span>
        </div>
      </motion.div>
    </div>
  );
}
