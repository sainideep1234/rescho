"use client";

import { SignIn } from "@clerk/nextjs";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

export default function SignInPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 left-1/4 w-[600px] h-[600px] bg-accent-primary/[0.07] rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-accent-secondary/[0.05] rounded-full blur-[150px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center mb-8"
        >
          <Link href="/" className="flex items-center gap-3 mb-4">
            <div
              className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg border border-white/10 overflow-hidden"
              style={{ colorScheme: "light" }}
            >
              <Image
                src="/logo.webp"
                alt="RESCHO Logo"
                width={36}
                height={36}
                className="object-contain"
                unoptimized
                priority
              />
            </div>
            <span className="text-xl font-bold text-text-primary tracking-tight">
              RESCHO
            </span>
          </Link>
          <p className="text-text-secondary text-sm text-center">
            Sign in to create your restaurant matching room
          </p>
        </motion.div>

        {/* Clerk SignIn Component — styled to match RESCHO */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex justify-center"
        >
          <SignIn
            appearance={{
              variables: {
                colorPrimary: "#ff3a5c",
                colorBackground: "#0e0e14",
                colorInputBackground: "#16161f",
                colorInputText: "#f0f0f5",
                colorText: "#f0f0f5",
                colorTextSecondary: "#8e8ea0",
                colorTextOnPrimaryBackground: "#ffffff",
                colorNeutral: "#f0f0f5",
                colorDanger: "#ff2d2d",
                borderRadius: "0.875rem",
                fontFamily: "Inter, system-ui, sans-serif",
                fontSize: "14px",
              },
              elements: {
                rootBox: "w-full",
                card: "bg-[#0e0e14] border border-white/[0.06] shadow-2xl rounded-2xl w-full",
                headerTitle: "text-[#f0f0f5] font-bold",
                headerSubtitle: "text-[#8e8ea0]",
                socialButtonsBlockButton:
                  "border border-white/20 bg-[#1c1c28] text-[#f0f0f5] hover:bg-[#242433] hover:border-white/30 transition-colors",
                socialButtonsBlockButtonText: "text-[#f0f0f5] font-semibold",
                socialButtonsBlockButtonArrow: "text-[#f0f0f5]",
                dividerLine: "bg-white/[0.06]",
                dividerText: "text-[#4a4a5a]",
                formFieldLabel: "text-[#8e8ea0] text-sm",
                formFieldInput:
                  "bg-[#16161f] border-white/[0.08] text-[#f0f0f5] focus:border-[#ff3a5c]/50 focus:ring-0 rounded-xl",
                formButtonPrimary:
                  "bg-gradient-to-r from-[#ff3a5c] to-[#d4284a] hover:shadow-[0_8px_32px_rgba(255,58,92,0.3)] transition-all font-semibold rounded-xl",
                footerActionLink:
                  "text-[#ff3a5c] hover:text-[#c0182e] font-medium",
                identityPreviewText: "text-[#f0f0f5]",
                identityPreviewEditButton: "text-[#ff3a5c]",
                formFieldAction: "text-[#ff3a5c] hover:text-[#c0182e]",
                alertText: "text-[#f0f0f5]",
                formResendCodeLink: "text-[#ff3a5c]",
              },
            }}
          />
        </motion.div>

        {/* Back to home */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center mt-6"
        >
          <Link
            href="/"
            className="text-text-muted text-sm hover:text-text-secondary transition-colors"
          >
            ← Back to home
          </Link>
        </motion.div>
      </div>
    </main>
  );
}
