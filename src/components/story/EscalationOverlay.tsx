"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { escalationBannerTitle } from "@/lib/story/escalation";
import type { EscalationEvent, ObjectCharacter } from "@/types";

interface EscalationOverlayProps {
  event: EscalationEvent;
  characters: ObjectCharacter[];
  onDismiss: () => void;
}

const TYPE_STYLES: Record<EscalationEvent["type"], { bg: string; accent: string; particles: string[] }> = {
  heartbreak: {
    bg: "from-rose-950/90 via-red-900/70 to-transparent",
    accent: "text-rose-300",
    particles: ["💔", "🌹", "🥀"],
  },
  argument: {
    bg: "from-amber-950/90 via-orange-900/70 to-transparent",
    accent: "text-amber-300",
    particles: ["⚡", "🔥", "💢"],
  },
  alliance_formed: {
    bg: "from-emerald-950/90 via-teal-900/70 to-transparent",
    accent: "text-emerald-300",
    particles: ["🤝", "✨", "🌟"],
  },
  boss_sequence: {
    bg: "from-red-950/90 via-rose-900/70 to-transparent",
    accent: "text-red-300",
    particles: ["👹", "⚠️", "💥"],
  },
  revelation: {
    bg: "from-violet-950/90 via-purple-900/70 to-transparent",
    accent: "text-violet-300",
    particles: ["🔮", "👁️", "✦"],
  },
};

export function EscalationOverlay({
  event,
  characters,
  onDismiss,
}: EscalationOverlayProps) {
  const style = TYPE_STYLES[event.type];
  const involvedChars = characters.filter((c) =>
    event.affectedCharacterIds.includes(c.id)
  );

  return (
    <motion.div
      className="absolute inset-0 z-[45] flex flex-col items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onDismiss}
    >
      {/* Gradient overlay */}
      <div className={cn("absolute inset-0 bg-gradient-to-b", style.bg)} />

      {/* Scanline effect */}
      <div className="absolute inset-0 scanlines opacity-30 pointer-events-none" />

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {style.particles.map((p, i) => (
          <motion.div
            key={i}
            className="absolute text-2xl"
            initial={{ opacity: 0, y: "100vh", x: `${20 + i * 30}%` }}
            animate={{ opacity: [0, 1, 0], y: "-10vh" }}
            transition={{ duration: 3, delay: i * 0.4, repeat: Infinity, repeatDelay: 1 }}
          >
            {p}
          </motion.div>
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-4 px-8 text-center max-w-sm">
        {/* Event type banner */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", delay: 0.1, stiffness: 300 }}
          className="px-4 py-2 rounded-full glass border border-white/20"
        >
          <span className={cn("font-mono-dm text-xs tracking-widest uppercase font-bold", style.accent)}>
            {escalationBannerTitle(event.type)}
          </span>
        </motion.div>

        {/* Title */}
        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="font-display text-white text-2xl font-bold leading-tight text-glow-story"
        >
          {event.title}
        </motion.h2>

        {/* Narrative text */}
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="font-body text-white/80 text-sm italic leading-relaxed"
        >
          "{event.narrativeText}"
        </motion.p>

        {/* Involved characters */}
        {involvedChars.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex gap-2"
          >
            {involvedChars.map((c) => (
              <div
                key={c.id}
                className="px-3 py-1.5 rounded-xl glass border border-white/20 text-center"
              >
                <p className="font-display text-[#f0d898] text-xs font-semibold">{c.name}</p>
                <p className="font-body text-white/40 text-[9px]">{c.emotionalState}</p>
              </div>
            ))}
          </motion.div>
        )}

        {/* Dismiss hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="font-mono-dm text-white/30 text-[10px] tracking-widest uppercase mt-2"
        >
          Tap anywhere to continue
        </motion.p>
      </div>
    </motion.div>
  );
}
