"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import type { StoryModeState, StoryGenre, ObjectCharacter } from "@/types";

interface StoryHUDProps {
  storyState: StoryModeState | null;
  sessionStartedAt?: number;
  onScan?: () => void;
  onSelectCharacter?: (character: ObjectCharacter) => void;
  scanLoading?: boolean;
  selectedCharacterId?: string | null;
  progression?: import("@/types").ProgressionState;
  scanState?: string;
  onScanRetry?: () => void;
  onRecap?: () => void;
}

const GENRE_CONFIG: Record<StoryGenre, { emoji: string; label: string; color: string; borderColor: string }> = {
  dating_sim:      { emoji: "💘", label: "DATING SIM",   color: "rgba(255,100,100,0.9)", borderColor: "#CC0000" },
  mystery:         { emoji: "🔍", label: "MYSTERY",      color: "#B0C4FF",               borderColor: "#3B4CCA" },
  fantasy:         { emoji: "⚔️", label: "FANTASY",      color: "#B0C4FF",               borderColor: "#3B4CCA" },
  survival:        { emoji: "🪓", label: "SURVIVAL",     color: "rgba(255,100,100,0.9)", borderColor: "#CC0000" },
  workplace_drama: { emoji: "💼", label: "WORK DRAMA",   color: "#FFDE00",               borderColor: "#B3A125" },
  soap_opera:      { emoji: "🌹", label: "SOAP OPERA",   color: "rgba(255,100,100,0.9)", borderColor: "#CC0000" },
};

export function StoryHUD({
  storyState,
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
    <div className="absolute bottom-0 inset-x-0 z-[20] flex flex-col gap-2 px-3 pb-5 pt-3 safe-bottom">
      {/* Gradient fade from bottom */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(to top, rgba(6,4,14,0.85) 0%, rgba(6,4,14,0.4) 60%, transparent 100%)" }}
      />

      <div className="relative z-10 flex flex-col gap-2">
        {/* Status row */}
        <div className="flex items-center gap-2 justify-between">
          {/* Genre badge */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1"
            style={{
              border: `2px solid ${genreConfig.borderColor}`,
              background: "rgba(30,6,6,0.92)",
              boxShadow: `2px 2px 0 ${genreConfig.borderColor}80`,
            }}
          >
            <span className="text-base leading-none">{genreConfig.emoji}</span>
            <span className="font-pixel text-base tracking-wide" style={{ color: genreConfig.color }}>
              {genreConfig.label}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {activeQuests.length > 0 && (
              <div
                className="flex items-center gap-1 px-2 py-1"
                style={{ border: "2px solid #B3A125", background: "rgba(30,6,6,0.92)", boxShadow: "2px 2px 0 rgba(179,161,37,0.5)" }}
              >
                <span className="text-base">⚔️</span>
                <span className="font-pixel text-base" style={{ color: "#FFDE00" }}>
                  {activeQuests.length} QUEST{activeQuests.length > 1 ? "S" : ""}
                </span>
              </div>
            )}
            <div
              className="px-2 py-1"
              style={{ border: "1px solid rgba(255,255,255,0.1)", background: "rgba(30,6,6,0.75)" }}
            >
              <span className="font-pixel text-base tracking-wider" style={{ color: "rgba(255,255,255,0.3)" }}>
                {phase.toUpperCase().replace("_", " ")}
              </span>
            </div>
          </div>
        </div>

        {/* Character scroll */}
        {characters.length > 0 ? (
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {characters.map((c) => (
              <motion.button
                key={c.id}
                onClick={onSelectCharacter ? () => onSelectCharacter(c) : undefined}
                className="flex-shrink-0 flex flex-col items-start touch-target"
                style={{
                  padding: "6px 10px",
                  border: `2px solid ${selectedCharacterId === c.id ? "#FFDE00" : "rgba(204,0,0,0.5)"}`,
                  background: selectedCharacterId === c.id ? "rgba(204,0,0,0.3)" : "rgba(30,6,6,0.9)",
                  boxShadow: selectedCharacterId === c.id ? "2px 2px 0 rgba(255,222,0,0.4)" : "2px 2px 0 rgba(204,0,0,0.3)",
                  minWidth: 80,
                }}
                whileTap={{ scale: 0.93 }}
              >
                <span className="font-pixel text-base whitespace-nowrap" style={{ color: selectedCharacterId === c.id ? "#FFDE00" : "#FFF0B0" }}>
                  {c.name}
                </span>
                <span className="font-vt text-base whitespace-nowrap" style={{ color: "rgba(255,255,255,0.4)" }}>
                  {c.emotionalState}
                </span>
                {/* Relationship bar — segmented */}
                <div className="flex gap-0.5 mt-1.5">
                  {Array.from({ length: 8 }).map((_, i) => {
                    const filled = i < Math.round((Math.abs(c.relationshipToUser) / 100) * 8);
                    const isPositive = c.relationshipToUser >= 0;
                    return (
                      <div
                        key={i}
                        className="w-1.5 h-1"
                        style={{
                    border: `1px solid ${isPositive ? "#FFDE00" : "#FF0000"}`,
                    background: filled ? (isPositive ? "#FFDE00" : "#FF0000") : "transparent",
                        }}
                      />
                    );
                  })}
                </div>
              </motion.button>
            ))}
          </div>
        ) : (
          <div
            className="py-2 px-3"
            style={{ border: "1px solid rgba(204,0,0,0.3)", background: "rgba(30,6,6,0.7)" }}
          >
            <p className="font-vt text-xl text-center" style={{ color: "rgba(255,255,255,0.25)" }}>
              ▸ Scan room to discover characters
            </p>
          </div>
        )}

        {/* Scan button */}
        <motion.button
          onClick={onScan}
          disabled={scanLoading}
          className="w-full touch-target font-pixel disabled:opacity-60"
          style={{
            background: scanLoading ? "rgba(204,0,0,0.4)" : "#CC0000",
            border: "2px solid #FFDE00",
            boxShadow: scanLoading ? "none" : "3px 3px 0 rgba(255,222,0,0.4)",
            padding: "10px 16px",
            fontSize: "16px",
            letterSpacing: "0.12em",
            color: "#FFDE00",
            transition: "box-shadow 0.05s, transform 0.05s",
          }}
          whileTap={{ scale: 0.97, boxShadow: "1px 1px 0 rgba(255,222,0,0.4)" }}
        >
          {scanLoading ? (
            <span className="flex items-center justify-center gap-2">
              <motion.span
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 0.6, repeat: Infinity, ease: "linear", repeatType: "mirror" }}
              >
                ◈
              </motion.span>
              SCANNING...
            </span>
          ) : characters.length === 0 ? (
            "▸ SCAN ROOM ◂"
          ) : (
            "▸ RESCAN ◂"
          )}
        </motion.button>
      </div>
    </div>
  );
}

export default StoryHUD;
