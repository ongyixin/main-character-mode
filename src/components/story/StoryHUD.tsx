"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/cn";
import type { StoryModeState, StoryGenre, ObjectCharacter } from "@/types";

interface StoryHUDProps {
  storyState: StoryModeState | null;
  // Original API
  sessionStartedAt?: number;
  onScan?: () => void;
  onSelectCharacter?: (character: ObjectCharacter) => void;
  scanLoading?: boolean;
  selectedCharacterId?: string | null;
  // Extended API (story/page.tsx compat)
  progression?: import("@/types").ProgressionState;
  scanState?: string;
  onScanRetry?: () => void;
  onRecap?: () => void;
}

const GENRE_CONFIG: Record<StoryGenre, { emoji: string; label: string; accentClass: string }> = {
  dating_sim: { emoji: "💘", label: "Dating Sim", accentClass: "text-rose-300 border-rose-400/30" },
  mystery: { emoji: "🔍", label: "Mystery", accentClass: "text-blue-300 border-blue-400/30" },
  fantasy: { emoji: "⚔️", label: "Fantasy", accentClass: "text-emerald-300 border-emerald-400/30" },
  survival: { emoji: "🪓", label: "Survival", accentClass: "text-orange-300 border-orange-400/30" },
  workplace_drama: { emoji: "💼", label: "Work Drama", accentClass: "text-amber-300 border-amber-400/30" },
  soap_opera: { emoji: "🌹", label: "Soap Opera", accentClass: "text-violet-300 border-violet-400/30" },
};

function useElapsedTime(startedAt: number): string {
  // Returns a formatted "mm:ss" string — client-side only
  if (typeof window === "undefined") return "00:00";
  const seconds = Math.floor((Date.now() - startedAt) / 1000);
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function StoryHUD({
  storyState,
  sessionStartedAt,
  onScan,
  onSelectCharacter,
  scanLoading,
  selectedCharacterId,
}: StoryHUDProps) {
  const genre = storyState?.genre ?? "mystery";
  const genreConfig = GENRE_CONFIG[genre];
  const characters = storyState?.characters ?? [];
  const activeQuests = storyState?.activeQuests.filter((q) => q.status === "active") ?? [];
  const phase = storyState?.phase ?? "scanning";

  return (
    <div className="absolute bottom-0 inset-x-0 z-[20] flex flex-col gap-2 px-4 pb-6 pt-3 safe-bottom">
      {/* Gradient fade up from bottom */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-2">
        {/* Top row: genre badge + phase + timer */}
        <div className="flex items-center justify-between">
          <div
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-full glass border",
              genreConfig.accentClass
            )}
          >
            <span className="text-sm">{genreConfig.emoji}</span>
            <span className={cn("font-mono-dm text-[10px] tracking-widest uppercase", genreConfig.accentClass.split(" ")[0])}>
              {genreConfig.label}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {activeQuests.length > 0 && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full glass border border-amber-400/30">
                <span className="text-xs">⚔️</span>
                <span className="font-mono-dm text-[10px] text-amber-300">
                  {activeQuests.length} Quest{activeQuests.length > 1 ? "s" : ""}
                </span>
              </div>
            )}
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full glass">
              <span className="font-mono-dm text-[10px] text-white/40 tracking-widest">
                {phase.toUpperCase().replace("_", " ")}
              </span>
            </div>
          </div>
        </div>

        {/* Character scroll list */}
        {characters.length > 0 ? (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {characters.map((c) => (
              <motion.button
                key={c.id}
                onClick={onSelectCharacter ? () => onSelectCharacter(c) : undefined}
                className={cn(
                  "flex-shrink-0 flex flex-col items-center gap-0.5",
                  "px-3 py-2 rounded-xl glass-story border transition-all",
                  "touch-target",
                  selectedCharacterId === c.id
                    ? "border-[#c89b3c]/60 shadow-[0_0_12px_rgba(200,155,60,0.3)]"
                    : "border-transparent"
                )}
                whileTap={{ scale: 0.93 }}
              >
                <span className="font-display text-[#f0d898] text-xs font-semibold whitespace-nowrap">
                  {c.name}
                </span>
                <span className="font-body text-white/40 text-[9px] whitespace-nowrap">
                  {c.emotionalState}
                </span>
                {/* Tiny relationship indicator */}
                <div className="w-8 h-0.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#7b3fc4] to-[#c89b3c]"
                    style={{ width: `${Math.abs(c.relationshipToUser)}%` }}
                  />
                </div>
              </motion.button>
            ))}
          </div>
        ) : (
          <p className="font-body text-white/30 text-xs text-center italic py-1">
            Scan the room to find the characters hiding in your objects
          </p>
        )}

        {/* Scan button */}
        <motion.button
          onClick={onScan}
          disabled={scanLoading}
          className={cn(
            "w-full touch-target rounded-2xl py-3.5 font-display font-bold text-sm tracking-widest",
            "bg-gradient-to-r from-[#7b3fc4] to-[#c89b3c]",
            "text-white shadow-[0_4px_24px_rgba(123,63,196,0.5)]",
            "disabled:opacity-60 active:scale-98 transition-all"
          )}
          whileTap={{ scale: 0.97 }}
        >
          {scanLoading ? (
            <span className="flex items-center justify-center gap-2">
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="inline-block"
              >
                ◐
              </motion.span>
              Scanning…
            </span>
          ) : characters.length === 0 ? (
            "✦ SCAN ROOM ✦"
          ) : (
            "✦ RESCAN ✦"
          )}
        </motion.button>
      </div>
    </div>
  );
}

export default StoryHUD;
