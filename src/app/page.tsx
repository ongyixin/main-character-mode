"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/cn";
import type { StoryGenre } from "@/types";

// ─── Genre config ─────────────────────────────────────────────────────────────

const GENRES: Array<{
  value: StoryGenre;
  label: string;
  emoji: string;
  tagline: string;
  accent: string;
  border: string;
}> = [
  {
    value: "mystery",
    label: "Mystery",
    emoji: "🔍",
    tagline: "Every object hides a secret",
    accent: "from-blue-700 to-cyan-600",
    border: "border-blue-400/30",
  },
  {
    value: "soap_opera",
    label: "Soap Opera",
    emoji: "🌹",
    tagline: "Everyone is betrayed. Always.",
    accent: "from-rose-700 to-pink-600",
    border: "border-rose-400/30",
  },
  {
    value: "workplace_drama",
    label: "Work Drama",
    emoji: "💼",
    tagline: "Your lamp is now HR",
    accent: "from-amber-700 to-yellow-600",
    border: "border-amber-400/30",
  },
  {
    value: "dating_sim",
    label: "Dating Sim",
    emoji: "💘",
    tagline: "Romance your furniture, if you dare",
    accent: "from-pink-700 to-rose-500",
    border: "border-pink-400/30",
  },
  {
    value: "fantasy",
    label: "Fantasy",
    emoji: "⚔️",
    tagline: "Ancient power stirs in the mundane",
    accent: "from-emerald-700 to-teal-600",
    border: "border-emerald-400/30",
  },
  {
    value: "survival",
    label: "Survival",
    emoji: "🪓",
    tagline: "Trust no one. Especially the fridge.",
    accent: "from-orange-700 to-red-600",
    border: "border-orange-400/30",
  },
];

// ─── Mode card ────────────────────────────────────────────────────────────────

function ModeCard({
  title,
  tagline,
  emoji,
  accent,
  onClick,
  delay = 0,
}: {
  title: string;
  tagline: string;
  emoji: string;
  accent: string;
  onClick: () => void;
  delay?: number;
}) {
  return (
    <motion.button
      onClick={onClick}
      className={cn(
        "relative w-full text-left rounded-3xl overflow-hidden",
        "border border-white/10",
        "active:scale-98 transition-transform"
      )}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6, type: "spring" }}
      whileTap={{ scale: 0.97 }}
    >
      {/* Gradient bg */}
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-80", accent)} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      {/* Grain texture */}
      <div className="grain absolute inset-0" />

      <div className="relative z-10 px-5 py-5">
        <span className="text-4xl mb-3 block">{emoji}</span>
        <h3 className="font-display text-white text-xl font-bold tracking-wide mb-1">
          {title}
        </h3>
        <p className="font-body text-white/70 text-sm">{tagline}</p>
      </div>
    </motion.button>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

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
    <div className="relative min-h-screen overflow-hidden bg-[#08080e] flex flex-col">
      {/* Atmospheric background */}
      <div className="absolute inset-0 bg-story-gradient" />
      <div className="absolute inset-0 grain" />

      {/* Scanlines faint overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(123,63,196,0.03) 3px, rgba(123,63,196,0.03) 4px)",
        }}
      />

      <AnimatePresence mode="wait">
        {screen === "landing" ? (
          <motion.div
            key="landing"
            className="relative z-10 flex flex-col h-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.4 }}
          >
            {/* Header */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-6">
              {/* Logo area */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.8, type: "spring" }}
                className="flex flex-col items-center gap-3"
              >
                {/* Symbol */}
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#7b3fc4] to-[#c89b3c] flex items-center justify-center shadow-[0_0_40px_rgba(123,63,196,0.5)]">
                    <span className="text-4xl">✦</span>
                  </div>
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-[#c89b3c]/40"
                    animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                </div>

                <div>
                  <h1 className="font-display text-white text-3xl font-bold tracking-wide text-glow-story">
                    Main Character
                  </h1>
                  <h1 className="font-display text-[#c89b3c] text-3xl font-bold tracking-wide text-glow-story">
                    Mode
                  </h1>
                </div>
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="font-body text-white/60 text-base leading-relaxed max-w-xs"
              >
                Your world is already a game.
                <br />
                You just haven't noticed yet.
              </motion.p>
            </div>

            {/* Mode cards */}
            <div className="px-5 pb-8 safe-bottom flex flex-col gap-3">
              <ModeCard
                title="Story Mode"
                tagline="Your objects become characters. Drama ensues."
                emoji="🎭"
                accent="from-[#7b3fc4] to-[#c89b3c]"
                onClick={handleStoryMode}
                delay={0.6}
              />
              <ModeCard
                title="Quest Mode"
                tagline="Your chores become missions. Your life has momentum."
                emoji="⚡"
                accent="from-[#0066aa] to-[#00d4ff]"
                onClick={handleQuestMode}
                delay={0.75}
              />

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.1 }}
                className="text-center font-mono-dm text-white/20 text-[10px] tracking-widest uppercase mt-1"
              >
                YC × Google DeepMind Hackathon
              </motion.p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="genre"
            className="relative z-10 flex flex-col h-screen"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Header */}
            <div className="px-5 pt-12 pb-4 safe-top">
              <button
                onClick={() => setScreen("landing")}
                className="text-white/40 hover:text-white/80 font-mono-dm text-sm tracking-wide transition-colors mb-4 block"
              >
                ← Back
              </button>
              <h2 className="font-display text-white text-2xl font-bold text-glow-story">
                Choose Your Genre
              </h2>
              <p className="font-body text-white/50 text-sm mt-1">
                This shapes how your objects behave.
              </p>
            </div>

            {/* Genre grid */}
            <div className="flex-1 overflow-y-auto px-5 pb-8 safe-bottom">
              <div className="grid grid-cols-2 gap-3 mt-2">
                {GENRES.map((genre, i) => (
                  <motion.button
                    key={genre.value}
                    onClick={() => handleGenreSelect(genre.value)}
                    disabled={entering}
                    className={cn(
                      "relative rounded-2xl overflow-hidden border",
                      genre.border,
                      "active:scale-95 transition-transform disabled:opacity-50"
                    )}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07, type: "spring" }}
                    whileTap={{ scale: 0.93 }}
                  >
                    <div className={cn("absolute inset-0 bg-gradient-to-br opacity-60", genre.accent)} />
                    <div className="grain absolute inset-0" />
                    <div className="relative z-10 px-3 py-4 text-left">
                      <span className="text-2xl mb-2 block">{genre.emoji}</span>
                      <p className="font-display text-white text-sm font-bold leading-tight">
                        {genre.label}
                      </p>
                      <p className="font-body text-white/60 text-[11px] mt-0.5 leading-snug">
                        {genre.tagline}
                      </p>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
