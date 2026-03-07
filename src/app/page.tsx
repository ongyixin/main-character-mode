"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/cn";
import { PixelCreature, PixelSparkle } from "@/components/ui/PixelCreature";
import type { StoryGenre } from "@/types";

// ─── Genre config ──────────────────────────────────────────────────────────────

const GENRES: Array<{
  value: StoryGenre;
  label: string;
  icon: string;
  tagline: string;
  bg: string;
  tagColor: string;
  creature: "blue" | "coral" | "mint" | "yellow";
}> = [
  {
    value: "mystery",
    label: "Shadow",
    icon: "🔮",
    tagline: "Every object hides a secret",
    bg: "bg-purple-50",
    tagColor: "bg-purple-200 text-purple-800",
    creature: "blue",
  },
  {
    value: "soap_opera",
    label: "Spirit",
    icon: "🌸",
    tagline: "Everyone is betrayed. Always.",
    bg: "bg-pink-50",
    tagColor: "bg-pink-200 text-pink-800",
    creature: "coral",
  },
  {
    value: "workplace_drama",
    label: "Neutral",
    icon: "⭐",
    tagline: "Your lamp is now HR",
    bg: "bg-amber-50",
    tagColor: "bg-amber-200 text-amber-800",
    creature: "yellow",
  },
  {
    value: "dating_sim",
    label: "Charm",
    icon: "💖",
    tagline: "Romance your furniture, if you dare",
    bg: "bg-rose-50",
    tagColor: "bg-rose-200 text-rose-800",
    creature: "coral",
  },
  {
    value: "fantasy",
    label: "Mystic",
    icon: "🐉",
    tagline: "Ancient power stirs in the mundane",
    bg: "bg-emerald-50",
    tagColor: "bg-emerald-200 text-emerald-800",
    creature: "mint",
  },
  {
    value: "survival",
    label: "Ember",
    icon: "🔥",
    tagline: "Trust no one. Especially the fridge.",
    bg: "bg-orange-50",
    tagColor: "bg-orange-200 text-orange-800",
    creature: "coral",
  },
];

// ─── Feature modules ───────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: "📡",
    title: "Scan the World",
    description: "AI analyzes objects through your camera.",
    bg: "bg-px-sky/20",
  },
  {
    icon: "✨",
    title: "Generate Creatures",
    description: "Objects become unique pixel creatures.",
    bg: "bg-px-yellow/30",
  },
  {
    icon: "⚔️",
    title: "Interact & Play",
    description: "Talk, battle, or complete quests with them.",
    bg: "bg-px-coral/20",
  },
];

// ─── Floating sparkle ──────────────────────────────────────────────────────────

function FloatingSparkle({ delay, x, y, color }: { delay: number; x: string; y: string; color: string }) {
  return (
    <motion.div
      className="pixel-sparkle"
      style={{ left: x, top: y }}
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 0] }}
      transition={{ duration: 3, delay, repeat: Infinity, ease: "easeInOut" }}
    >
      <PixelSparkle size={14} color={color} />
    </motion.div>
  );
}

// ─── Pixel cloud ───────────────────────────────────────────────────────────────

function PixelCloud({ x, y, scale, delay }: { x: string; y: string; scale: number; delay: number }) {
  return (
    <motion.div
      className="pixel-cloud pixel-cloud-drift"
      style={{ left: x, top: y, animationDelay: `${delay}s` }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.3 }}
      transition={{ delay: delay * 0.5, duration: 1 }}
    >
      <svg
        viewBox="0 0 24 12"
        width={48 * scale}
        height={24 * scale}
        shapeRendering="crispEdges"
        style={{ imageRendering: "pixelated" }}
      >
        <rect x="4" y="4" width="16" height="8" fill="white" />
        <rect x="2" y="6" width="2" height="4" fill="white" />
        <rect x="20" y="6" width="2" height="4" fill="white" />
        <rect x="6" y="2" width="4" height="2" fill="white" />
        <rect x="14" y="2" width="4" height="2" fill="white" />
        <rect x="8" y="0" width="3" height="2" fill="white" />
      </svg>
    </motion.div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

type Screen = "landing" | "genre_select";

export default function HomePage() {
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>("landing");
  const [entering, setEntering] = useState(false);

  function handleStoryMode() {
    setScreen("genre_select");
  }

  function handleQuestMode() {
    router.push("/quest");
  }

  async function handleGenreSelect(genre: StoryGenre) {
    if (entering) return;
    setEntering(true);
    router.push(`/story?genre=${genre}`);
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden pixel-bg">
      {/* Pixel scan line */}
      <div className="pixel-scan-line z-20" />

      {/* Floating sparkles */}
      <FloatingSparkle delay={0} x="12%" y="18%" color="#FFD95A" />
      <FloatingSparkle delay={1.5} x="85%" y="14%" color="#6EC5FF" />
      <FloatingSparkle delay={0.8} x="72%" y="35%" color="#FF7E79" />
      <FloatingSparkle delay={2.2} x="22%" y="68%" color="#7DE2A6" />
      <FloatingSparkle delay={3} x="88%" y="72%" color="#FFD95A" />
      <FloatingSparkle delay={0.4} x="50%" y="88%" color="#6EC5FF" />

      {/* Pixel clouds */}
      <PixelCloud x="5%" y="8%" scale={1} delay={0} />
      <PixelCloud x="70%" y="5%" scale={0.8} delay={2} />
      <PixelCloud x="40%" y="12%" scale={0.6} delay={4} />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 sm:px-6 lg:px-10">
        <AnimatePresence mode="wait">
          {screen === "landing" ? (
            <motion.div
              key="landing"
              className="flex min-h-screen w-full flex-col"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.4 }}
            >
              {/* ─── Navbar ──────────────────────────────────────────────────── */}
              <motion.nav
                className="safe-top flex items-center justify-between pt-4 pb-3"
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
              >
                <div className="flex items-center gap-2">
                  <PixelCreature variant="blue" size={28} animate={false} />
                  <span className="font-pixel text-px-dark text-[10px] tracking-wide">
                    TinyCatch
                  </span>
                </div>
                <div className="hidden items-center gap-1 sm:flex">
                  {["Explore", "How It Works", "Demo"].map((label) => (
                    <button
                      key={label}
                      className="rounded px-2.5 py-1.5 font-pixel-body text-xs font-semibold text-px-dark/40 transition-all hover:bg-px-dark/5 hover:text-px-dark"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </motion.nav>

              {/* ─── Hero Section ─────────────────────────────────────────────── */}
              <div className="flex flex-1 flex-col items-center justify-center px-2 py-8 text-center sm:px-6">
                {/* Floating pixel creatures */}
                <motion.div
                  className="mb-6 flex items-end gap-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                >
                  <motion.div
                    className="pixel-float"
                    style={{ animationDelay: "0s" }}
                  >
                    <PixelCreature variant="mint" size={48} />
                  </motion.div>
                  <motion.div
                    className="pixel-float"
                    style={{ animationDelay: "0.5s" }}
                  >
                    <PixelCreature variant="coral" size={72} />
                  </motion.div>
                  <motion.div
                    className="pixel-float"
                    style={{ animationDelay: "1s" }}
                  >
                    <PixelCreature variant="blue" size={56} />
                  </motion.div>
                  <motion.div
                    className="pixel-float"
                    style={{ animationDelay: "1.5s" }}
                  >
                    <PixelCreature variant="yellow" size={44} />
                  </motion.div>
                </motion.div>

                {/* Headline */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  className="flex max-w-2xl flex-col items-center gap-3"
                >
                  <h1 className="font-pixel text-px-dark text-[13px] leading-[1.8] sm:text-sm">
                    Discover Tiny Creatures{" "}
                    <span className="text-px-coral">in the Real World</span>
                  </h1>
                  <p className="max-w-xl font-pixel-body text-sm font-medium leading-relaxed text-px-dark/60 sm:text-base">
                    Point your camera anywhere and watch objects transform into adorable pixel creatures.
                  </p>
                </motion.div>

                {/* CTA Button */}
                <motion.button
                  onClick={handleStoryMode}
                  className="pixel-btn mt-8"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.4 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span>▶</span>
                  Start Scanning
                </motion.button>
              </div>

              {/* ─── Pixel grass divider ──────────────────────────────────────── */}
              <motion.div
                className="pixel-grass w-full"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 1, duration: 0.4 }}
                style={{ transformOrigin: "left" }}
              />

              {/* ─── Feature Cards ────────────────────────────────────────────── */}
              <div className="bg-white/40 px-1 py-5 sm:px-2">
                <motion.div
                  className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.1, duration: 0.5 }}
                >
                  {FEATURES.map((f, i) => (
                    <motion.div
                      key={f.title}
                      className="pixel-panel flex flex-col items-center gap-2 p-3 text-center"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.1 + i * 0.1, type: "spring" }}
                    >
                      <div className={cn("pixel-icon-box", f.bg)}>
                        <span>{f.icon}</span>
                      </div>
                      <p className="font-pixel text-[7px] leading-snug tracking-wide text-px-dark sm:text-[8px]">
                        {f.title}
                      </p>
                      <p className="font-pixel-body text-[11px] font-medium leading-snug text-px-dark/50">
                        {f.description}
                      </p>
                    </motion.div>
                  ))}
                </motion.div>
              </div>

              {/* ─── Mode Selection Cards ────────────────────────────────────── */}
              <div className="safe-bottom flex flex-col gap-3 bg-px-cream px-1 pb-6 pt-4 sm:px-2">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.4 }}
                  className="text-center"
                >
                  <p className="mb-3 font-pixel text-[7px] tracking-[0.15em] text-px-dark/30">
                    CHOOSE YOUR MODE
                  </p>
                </motion.div>

                <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-3 md:grid-cols-2">
                  <motion.button
                    onClick={handleStoryMode}
                    className="pixel-panel group p-4 text-left"
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.5, type: "spring" }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <PixelCreature variant="coral" size={28} animate={false} />
                      <p className="font-pixel text-[8px] text-px-dark sm:text-[9px]">Story Mode</p>
                    </div>
                    <p className="font-pixel-body text-[11px] font-medium leading-snug text-px-dark/50">
                      Objects become creatures. Drama ensues.
                    </p>
                  </motion.button>

                  <motion.button
                    onClick={handleQuestMode}
                    className="pixel-panel group p-4 text-left"
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.6, type: "spring" }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <PixelCreature variant="blue" size={28} animate={false} />
                      <p className="font-pixel text-[8px] text-px-dark sm:text-[9px]">Quest Mode</p>
                    </div>
                    <p className="font-pixel-body text-[11px] font-medium leading-snug text-px-dark/50">
                      Your chores become missions. Level up.
                    </p>
                  </motion.button>
                </div>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.8 }}
                  className="mt-1 text-center font-pixel text-[7px] tracking-[0.15em] text-px-dark/20"
                >
                  YC × GOOGLE DEEPMIND
                </motion.p>
              </div>
            </motion.div>
          ) : (
            /* ─── Genre Selection Screen ───────────────────────────────────── */
            <motion.div
              key="genre"
              className="flex min-h-screen w-full flex-col"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              {/* Header */}
              <div className="safe-top mx-auto w-full max-w-5xl px-1 pb-4 pt-6 sm:px-2">
                <motion.button
                  onClick={() => setScreen("landing")}
                  className="mb-4 flex items-center gap-1.5 font-pixel text-[8px] text-px-dark/40 transition-colors hover:text-px-dark"
                  whileTap={{ scale: 0.95 }}
                >
                  ◀ Back
                </motion.button>

                <div className="mb-1 flex items-center gap-3">
                  <PixelCreature variant="yellow" size={32} animate={false} />
                  <h2 className="font-pixel text-[10px] tracking-wide text-px-dark sm:text-[11px]">
                    Choose Class
                  </h2>
                </div>
                <p className="mt-1 pl-11 font-pixel-body text-sm font-medium text-px-dark/50">
                  This shapes how your creatures behave.
                </p>
              </div>

              {/* Genre grid */}
              <div className="safe-bottom flex-1 overflow-y-auto px-1 pb-8 sm:px-2">
                <div className="mx-auto mt-2 grid w-full max-w-5xl grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {GENRES.map((genre, i) => (
                    <motion.button
                      key={genre.value}
                      onClick={() => handleGenreSelect(genre.value)}
                      disabled={entering}
                      className={cn(
                        "pixel-panel overflow-hidden text-left",
                        "disabled:opacity-50"
                      )}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.07, type: "spring" }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {/* Tag header */}
                      <div className={cn("flex items-center justify-between px-3 py-1.5", genre.bg)}>
                        <span className={cn("pixel-tag", genre.tagColor)}>
                          {genre.label}
                        </span>
                        <PixelCreature variant={genre.creature} size={20} animate={false} />
                      </div>
                      <div className="p-3">
                        <span className="mb-1.5 block text-xl">{genre.icon}</span>
                        <p className="font-pixel text-[8px] leading-relaxed text-px-dark">
                          {genre.value.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
                        </p>
                        <p className="mt-0.5 font-pixel-body text-[11px] font-medium leading-snug text-px-dark/50">
                          {genre.tagline}
                        </p>
                      </div>
                    </motion.button>
                  ))}
                </div>

                {/* Loading overlay */}
                <AnimatePresence>
                  {entering && (
                    <motion.div
                      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-px-cream/95"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <motion.div
                        className="pixel-float"
                      >
                        <PixelCreature variant="blue" size={64} animate={false} />
                      </motion.div>
                      <motion.p
                        className="mt-4 font-pixel text-[8px] tracking-widest text-px-dark/40"
                        animate={{ opacity: [0.3, 0.8, 0.3] }}
                        transition={{ duration: 1.2, repeat: Infinity }}
                      >
                        Loading...
                      </motion.p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
