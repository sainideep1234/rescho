"use client";

import { forwardRef, ReactNode, MouseEventHandler } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

interface ButtonProps {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  className?: string;
  disabled?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  type?: "button" | "submit" | "reset";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      isLoading,
      className = "",
      disabled,
      onClick,
      type = "button",
    },
    ref,
  ) => {
    const baseStyles =
      "font-semibold rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 tracking-tight";

    const variants = {
      primary:
        "bg-gradient-to-br from-accent-primary to-[#d4284a] text-white hover:shadow-[0_8px_32px_rgba(255,58,92,0.3)] hover:-translate-y-0.5 disabled:opacity-40 disabled:hover:shadow-none disabled:hover:translate-y-0",
      secondary:
        "border-[1.5px] border-accent-secondary text-accent-secondary hover:bg-accent-secondary hover:text-bg-primary hover:shadow-[0_8px_32px_rgba(168,85,247,0.3)] disabled:opacity-40",
      ghost:
        "text-text-secondary hover:text-text-primary hover:bg-bg-tertiary/60 disabled:opacity-40",
    };

    const sizes = {
      sm: "px-4 py-2 text-xs",
      md: "px-5 py-2.5 text-sm",
      lg: "px-7 py-3 text-sm",
    };

    return (
      <motion.button
        ref={ref}
        type={type}
        whileTap={{ scale: 0.97 }}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled || isLoading}
        onClick={onClick}
      >
        {isLoading ? (
          <>
            <Loader2 className="animate-spin h-5 w-5" />
            Loading...
          </>
        ) : (
          children
        )}
      </motion.button>
    );
  },
);

Button.displayName = "Button";

export default Button;
