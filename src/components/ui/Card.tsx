"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";

interface CardProps {
  children: ReactNode;
  className?: string;
  glow?: "green" | "purple" | "none";
  onClick?: () => void;
}

export default function Card({
  children,
  className = "",
  glow = "none",
  onClick,
}: CardProps) {
  const glowStyles = {
    green: "hover:shadow-[0_8px_32px_rgba(6,214,160,0.15)]",
    purple: "hover:shadow-[0_8px_32px_rgba(168,85,247,0.15)]",
    none: "",
  };

  return (
    <motion.div
      whileHover={{ scale: onClick ? 1.02 : 1 }}
      whileTap={{ scale: onClick ? 0.98 : 1 }}
      onClick={onClick}
      className={`
        bg-bg-secondary/80 rounded-2xl border border-white/[0.04]
        backdrop-blur-sm
        transition-all duration-300
        ${glowStyles[glow]}
        ${onClick ? "cursor-pointer" : ""}
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
}
