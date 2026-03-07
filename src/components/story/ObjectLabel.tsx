"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { relationshipLabel, relationshipColor } from "@/lib/story/relationships";
import type { ObjectCharacter } from "@/types";

interface ObjectLabelProps {
  character: ObjectCharacter;
  position?: "left" | "center" | "right" | "background";
  onClick?: () => void;
  isSelected?: boolean;
  index?: number;
  x?: number;
  y?: number;
  onTap?: (character: ObjectCharacter) => void;
  isActive?: boolean;
  delay?: number;
}

function positionToCSS(
  position: "left" | "center" | "right" | "background",
  index: number
): { left?: string; right?: string; top?: string; transform?: string } {
  const topVariants = ["38%", "45%", "32%", "52%", "28%"];
  const top = topVariants[index % topVariants.length];

  switch (position) {
    case "left":
      return { left: "6%", top };
    case "center":
      return { left: "50%", top, transform: "translateX(-50%)" };
    case "right":
      return { right: "6%", top };
    case "background":
      return { left: `${30 + (index * 17) % 40}%`, top: "18%" };
    default:
      return { left: "50%", top, transform: "translateX(-50%)" };
  }
}

const EMOTION_EMOJI: Record<string, string> = {
  longing: "💫",
  jealous: "😤",
  suspicious: "🤨",
  tempting: "😈",
  smug: "😏",
  resigned: "😑",
  desperate: "😰",
  performing: "🎭",
  protective: "🛡️",
  wistful: "🌙",
  dramatic: "🌹",
  volatile: "⚡",
  anxious: "😬",
  knowing: "👁️",
  intimate: "🖤",
  inviting: "✨",
  parched: "🥺",
  trampled: "😔",
  burdened: "⚓",
  guarded: "🔒",
  disappointed: "😞",
  pensive: "🤔",
  expressive: "🎵",
  cautious: "👀",
  flustered: "😳",
  calculating: "🧮",
};

function getEmoji(emotionalState: string): string {
  const lower = emotionalState.toLowerCase();
  for (const [key, emoji] of Object.entries(EMOTION_EMOJI)) {
    if (lower.includes(key)) return emoji;
  }
  return "✦";
}

// Relationship color map for pixel style
function getRelColor(score: number): string {
  if (score >= 60) return "#FFDE00";
  if (score >= 30) return "#FFDE00";
  if (score >= -30) return "rgba(255,255,255,0.5)";
  if (score >= -60) return "#CC0000";
  return "#FF0000";
}

export function ObjectLabel({
  character,
  position,
  onClick,
  isSelected = false,
  index = 0,
  x,
  y,
  onTap,
  isActive,
  delay,
}: ObjectLabelProps) {
  const posStyle: React.CSSProperties =
    x !== undefined && y !== undefined
      ? { position: "absolute", left: `${x * 100}%`, top: `${y * 100}%`, transform: "translate(-50%, -50%)" }
      : positionToCSS(position ?? "center", index);
  const handleClick = onTap ? () => onTap(character) : onClick ?? (() => {});
  const effectiveSelected = isActive ?? isSelected;
  const effectiveDelay = delay ?? index * 0.12;
  const relLabel = relationshipLabel(character.relationshipToUser);
  const emoji = getEmoji(character.emotionalState);
  const relColor = getRelColor(character.relationshipToUser);
  const filledSegs = Math.round((Math.abs(character.relationshipToUser) / 100) * 6);
  const isPositive = character.relationshipToUser >= 0;

  return (
    <motion.button
      className="absolute z-[10] touch-target cursor-pointer flex flex-col items-center gap-0"
      style={posStyle}
      onClick={handleClick}
      initial={{ opacity: 0, scale: 0.5, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.4, y: -8 }}
      transition={{ duration: 0.4, delay: effectiveDelay, type: "spring", stiffness: 220 }}
      whileTap={{ scale: 0.90 }}
      aria-label={`Talk to ${character.name}`}
    >
      {/* NPC name tag */}
      <div
        style={{
          background: effectiveSelected ? "rgba(204,0,0,0.92)" : "rgba(6,4,14,0.90)",
          border: `2px solid ${effectiveSelected ? "#FFDE00" : "#CC0000"}`,
          boxShadow: effectiveSelected
            ? "3px 3px 0 rgba(255,222,0,0.4), 0 0 12px rgba(255,222,0,0.2)"
            : "2px 2px 0 rgba(204,0,0,0.5)",
          padding: "5px 8px",
          minWidth: 90,
        }}
      >
        {/* Emotion + Name */}
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-base leading-none">{emoji}</span>
          <span
            className="font-pixel text-base whitespace-nowrap"
            style={{ color: effectiveSelected ? "#FFDE00" : "#FFF0B0" }}
          >
            {character.name}
          </span>
        </div>

        {/* Personality subtitle */}
        <p className="font-vt text-base" style={{ color: "rgba(255,255,255,0.45)" }}>
          {character.personality}
        </p>

        {/* Segmented relationship bar */}
        <div className="flex items-center gap-1 mt-1.5">
          <div className="flex gap-0.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="w-2 h-1.5"
                style={{
                  border: `1px solid ${relColor}`,
                  background: i < filledSegs ? relColor : "transparent",
                }}
              />
            ))}
          </div>
          <span className="font-pixel text-base" style={{ color: relColor }}>
            {relLabel.toUpperCase().slice(0, 4)}
          </span>
        </div>
      </div>

      {/* Selection indicator */}
      {effectiveSelected && (
        <motion.div
          initial={{ opacity: 0, y: -2 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-0.5"
        >
          <span
            className="font-pixel text-base animate-blink"
            style={{ color: "#FFDE00" }}
          >
            ▼ TALKING
          </span>
        </motion.div>
      )}
    </motion.button>
  );
}

export default ObjectLabel;
