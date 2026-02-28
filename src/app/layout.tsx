import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "RESCHO - Find Your Perfect Dinner Spot Together",
  description:
    "A gamified restaurant matching app. Connect with your partner, swipe through restaurants, and find the perfect place for your next meal together.",
  keywords: ["restaurant", "dating", "dinner", "matching", "food", "swipe"],
  icons: {
    icon: [{ url: "/favicon.png", type: "image/png" }],
    apple: [{ url: "/favicon.png" }],
    shortcut: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark" suppressHydrationWarning>
        <body
          suppressHydrationWarning
          className={`${inter.variable} antialiased no-pull-refresh noise`}
          style={{
            fontFamily:
              "var(--font-geist-sans), Inter, system-ui, -apple-system, sans-serif",
          }}
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
