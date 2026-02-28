"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import {
  Star,
  MapPin,
  Heart,
  Users,
  ArrowUpDown,
  X,
  Zap,
  Crosshair,
  HeartHandshake,
} from "lucide-react";

export default function Features() {
  return (
    <>
      {/* Bento Grid — Discover Section */}
      <section id="discover" className="section-padding">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <span className="text-accent-secondary text-caption font-semibold tracking-[0.2em] uppercase">
              Discover
            </span>
            <h2 className="text-headline mt-2 mb-3">
              Explore <span className="gradient-text-primary">Cuisines</span>{" "}
              You Love
            </h2>
            <p className="text-text-secondary text-body-lg max-w-md leading-relaxed">
              From sushi to burgers, pasta to tacos — swipe through the best
              restaurants near you.
            </p>
          </motion.div>

          {/* Bento Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 grid-rows-[auto] gap-5 md:gap-6">
            {/* Large featured card — spans 2 cols, 2 rows */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="col-span-2 row-span-2 group relative rounded-2xl overflow-hidden border border-white/[0.04] bg-bg-secondary min-h-[300px] md:min-h-[380px]"
            >
              <Image
                src="/food-sushi.png"
                alt="Premium Sushi"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                <div className="inline-flex items-center gap-2 bg-accent-primary/20 backdrop-blur-sm px-3 py-1.5 rounded-full mb-3">
                  <span className="text-sm">🍣</span>
                  <span className="text-accent-primary text-xs font-semibold tracking-wider">
                    PREMIUM PICK
                  </span>
                </div>
                <h3 className="text-title text-white mb-2">Japanese Cuisine</h3>
                <p className="text-white/60 text-body">
                  Discover the finest sushi, ramen, and izakaya spots in your
                  area
                </p>
                <div className="flex items-center gap-1 mt-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 text-accent-primary"
                      fill="currentColor"
                      strokeWidth={0}
                    />
                  ))}
                  <span className="text-white/50 text-caption ml-2">
                    4.9 Rating
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Stat card — top right */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="col-span-1 group relative rounded-2xl overflow-hidden border border-white/[0.04] bg-gradient-to-br from-accent-primary/[0.08] to-bg-secondary p-5 flex flex-col justify-between min-h-[170px]"
            >
              <div className="w-11 h-11 rounded-xl bg-accent-primary/15 flex items-center justify-center mb-4">
                <MapPin className="w-5 h-5 text-accent-primary" />
              </div>
              <div>
                <p className="text-headline text-accent-primary">500+</p>
                <p className="text-text-secondary text-caption mt-1">
                  Restaurants Nearby
                </p>
              </div>
            </motion.div>

            {/* Pasta card — mid right */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="col-span-1 group relative rounded-2xl overflow-hidden border border-white/[0.04] bg-bg-secondary min-h-[170px]"
            >
              <Image
                src="/food-pasta.png"
                alt="Italian pasta"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <p className="text-white font-semibold text-base">Italian</p>
                <p className="text-white/50 text-xs mt-1">42 spots nearby</p>
              </div>
            </motion.div>

            {/* Burger card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="col-span-1 group relative rounded-2xl overflow-hidden border border-white/[0.04] bg-bg-secondary min-h-[170px]"
            >
              <Image
                src="/food-burger.png"
                alt="Gourmet burger"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <p className="text-white font-semibold text-base">Burgers</p>
                <p className="text-white/50 text-xs mt-1">38 spots nearby</p>
              </div>
            </motion.div>

            {/* Match percentage card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="col-span-1 group relative rounded-2xl overflow-hidden border border-white/[0.04] bg-gradient-to-br from-accent-secondary/[0.08] to-bg-secondary p-5 flex flex-col justify-between min-h-[170px]"
            >
              <div className="w-11 h-11 rounded-xl bg-accent-secondary/15 flex items-center justify-center mb-4">
                <Heart
                  className="w-5 h-5 text-accent-secondary"
                  fill="currentColor"
                  strokeWidth={0}
                />
              </div>
              <div>
                <p className="text-headline text-accent-secondary">92%</p>
                <p className="text-text-secondary text-caption mt-1">
                  Match Success Rate
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features — How It Works */}
      <section id="features" className="section-padding">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <span className="text-accent-tertiary text-caption font-semibold tracking-[0.2em] uppercase">
              How It Works
            </span>
            <h2 className="text-headline mt-2 mb-3">
              Three Steps to Your{" "}
              <span className="gradient-text-vivid">Perfect Meal</span>
            </h2>
            <p className="text-text-secondary text-body-lg max-w-md mx-auto">
              No more endless debates about where to eat. Let the swiping
              decide!
            </p>
          </motion.div>

          {/* Bento feature cards */}
          <div className="grid md:grid-cols-3 gap-5">
            {/* Step 1 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="group relative rounded-2xl overflow-hidden border border-white/[0.04] bg-bg-secondary/80 p-7 hover:border-accent-primary/20 transition-all duration-500"
            >
              {/* Step number */}
              <div className="absolute top-6 right-6 w-10 h-10 rounded-full bg-accent-primary/10 flex items-center justify-center">
                <span className="text-accent-primary font-bold text-lg">1</span>
              </div>
              {/* Icon */}
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-primary/15 to-accent-primary/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Users className="w-6 h-6 text-accent-primary" />
              </div>
              <h3 className="text-title mb-3 text-text-primary">
                Create or Join
              </h3>
              <p className="text-text-secondary text-body leading-relaxed">
                Create a room and share the code with your partner, or join
                using their code. Connect in seconds.
              </p>
              {/* Decorative line */}
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-accent-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </motion.div>

            {/* Step 2 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="group relative rounded-2xl overflow-hidden border border-white/[0.04] bg-bg-secondary/80 p-7 hover:border-accent-secondary/20 transition-all duration-500"
            >
              <div className="absolute top-6 right-6 w-10 h-10 rounded-full bg-accent-secondary/10 flex items-center justify-center">
                <span className="text-accent-secondary font-bold text-lg">
                  2
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-secondary/15 to-accent-secondary/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <ArrowUpDown className="w-6 h-6 text-accent-secondary" />
              </div>
              <h3 className="text-title mb-3 text-text-primary">
                Swipe & Explore
              </h3>
              <p className="text-text-secondary text-body leading-relaxed">
                Swipe right on restaurants you love, left on ones you
                don&apos;t. Browse through real local spots near you.
              </p>
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-accent-secondary to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </motion.div>

            {/* Step 3 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="group relative rounded-2xl overflow-hidden border border-white/[0.04] bg-bg-secondary/80 p-7 hover:border-accent-tertiary/20 transition-all duration-500"
            >
              <div className="absolute top-6 right-6 w-10 h-10 rounded-full bg-accent-tertiary/10 flex items-center justify-center">
                <span className="text-accent-tertiary font-bold text-lg">
                  3
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-tertiary/15 to-accent-tertiary/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Heart
                  className="w-6 h-6 text-accent-tertiary"
                  fill="currentColor"
                  strokeWidth={0}
                />
              </div>
              <h3 className="text-title mb-3 text-text-primary">
                Match & Dine!
              </h3>
              <p className="text-text-secondary text-body leading-relaxed">
                When you and your partner both swipe right on the same
                restaurant — it&apos;s a match! Time to eat! 🎉
              </p>
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-accent-tertiary to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works — Visual Steps */}
      <section id="how-it-works" className="section-padding">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-2xl overflow-hidden border border-white/[0.04] bg-gradient-to-br from-bg-secondary via-bg-secondary to-accent-primary/[0.04] p-8 md:p-12"
          >
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-accent-primary/[0.04] rounded-full blur-[120px]" />
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-accent-secondary/[0.03] rounded-full blur-[100px]" />

            <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
              <div>
                <span className="text-accent-primary text-caption font-semibold tracking-[0.2em] uppercase">
                  Ready to Choose?
                </span>
                <h2 className="text-headline mt-2 mb-3 text-text-primary">
                  Stop debating.{" "}
                  <span className="gradient-text-primary">Start swiping.</span>
                </h2>
                <p className="text-text-secondary text-body-lg mb-8 leading-relaxed">
                  Connect with your partner in real-time, swipe through
                  restaurants independently, and let the algorithm find your
                  perfect match. It&apos;s that simple.
                </p>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-3 glass-light rounded-2xl px-5 py-4">
                    <div className="w-10 h-10 rounded-xl bg-accent-primary/15 flex items-center justify-center">
                      <Zap
                        className="w-5 h-5 text-accent-primary"
                        fill="currentColor"
                        strokeWidth={0}
                      />
                    </div>
                    <div>
                      <p className="text-text-primary text-sm font-semibold">
                        Real-time
                      </p>
                      <p className="text-text-muted text-xs">Instant sync</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 glass-light rounded-2xl px-5 py-4">
                    <div className="w-10 h-10 rounded-xl bg-accent-secondary/15 flex items-center justify-center">
                      <Crosshair className="w-5 h-5 text-accent-secondary" />
                    </div>
                    <div>
                      <p className="text-text-primary text-sm font-semibold">
                        Accurate
                      </p>
                      <p className="text-text-muted text-xs">GPS based</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 glass-light rounded-2xl px-5 py-4">
                    <div className="w-10 h-10 rounded-xl bg-accent-tertiary/15 flex items-center justify-center">
                      <HeartHandshake className="w-5 h-5 text-accent-tertiary" />
                    </div>
                    <div>
                      <p className="text-text-primary text-sm font-semibold">
                        Fun
                      </p>
                      <p className="text-text-muted text-xs">Gamified UX</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                {/* Phone mockup with swipe preview */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="relative"
                >
                  <div className="w-64 h-[420px] bg-bg-primary rounded-[2.5rem] border-2 border-white/[0.08] p-3 shadow-2xl">
                    <div className="w-full h-full rounded-[2rem] overflow-hidden bg-bg-secondary relative">
                      {/* Phone screen content */}
                      <div className="absolute inset-0 flex flex-col">
                        {/* Status bar */}
                        <div className="flex items-center justify-between px-5 pt-3 pb-2">
                          <span className="text-[10px] text-text-muted">
                            Room: A7X2
                          </span>
                          <div className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-accent-tertiary" />
                            <span className="text-[10px] text-text-muted">
                              Connected
                            </span>
                          </div>
                        </div>
                        {/* Card stack */}
                        <div className="flex-1 px-3 pb-3 relative">
                          {/* Back card */}
                          <div className="absolute inset-x-5 top-2 bottom-4 rounded-xl bg-bg-tertiary opacity-40 transform rotate-2" />
                          {/* Front card */}
                          <motion.div
                            animate={{ rotate: [-2, 2, -2] }}
                            transition={{
                              duration: 4,
                              repeat: Infinity,
                              ease: "easeInOut",
                            }}
                            className="absolute inset-x-3 top-0 bottom-2 rounded-xl overflow-hidden"
                          >
                            <Image
                              src="/food-pasta.png"
                              alt="Restaurant preview"
                              fill
                              className="object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                            <div className="absolute bottom-3 left-3 right-3">
                              <div className="inline-flex items-center gap-1 bg-accent-secondary/30 backdrop-blur-sm px-2 py-0.5 rounded-full mb-1">
                                <span className="text-accent-secondary text-[10px] font-medium">
                                  Italian
                                </span>
                              </div>
                              <p className="text-white font-bold text-sm">
                                Trattoria Bella
                              </p>
                              <p className="text-white/60 text-[10px]">
                                0.9km • $$$ • 9.0★
                              </p>
                            </div>
                          </motion.div>
                        </div>
                        {/* Action buttons */}
                        <div className="flex justify-center gap-6 pb-4">
                          <motion.div
                            animate={{ x: [-3, 3, -3] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="w-11 h-11 rounded-full bg-accent-error/15 flex items-center justify-center"
                          >
                            <X
                              className="w-5 h-5 text-accent-error"
                              strokeWidth={2.5}
                            />
                          </motion.div>
                          <motion.div
                            animate={{ x: [3, -3, 3] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="w-11 h-11 rounded-full bg-accent-primary/15 flex items-center justify-center"
                          >
                            <Heart
                              className="w-5 h-5 text-accent-primary"
                              fill="currentColor"
                              strokeWidth={0}
                            />
                          </motion.div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Floating match notification */}
                  <motion.div
                    animate={{ y: [-4, 4, -4], x: [2, -2, 2] }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="absolute -top-4 -right-8 bg-gradient-to-r from-accent-primary to-accent-secondary text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-accent-primary/20"
                  >
                    🎉 It&apos;s a Match!
                  </motion.div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
