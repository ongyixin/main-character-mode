"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { relationshipLabel, relationshipColor } from "@/lib/story/relationships";
import type { ObjectCharacter } from "@/types";

interface ObjectLabelProps {
  character: ObjectCharacter;
  // Original API (position-based)
  position?: "left" | "center" | "right" | "background";
  onClick?: () => void;
  isSelected?: boolean;
  index?: number;
  // Extended API used by story/page.tsx (coordinate-based)
  x?: number;
  y?: number;
  onTap?: (character: ObjectCharacter) => void;
  isActive?: boolean;
  delay?: number;
}

// Map detected position to screen percentage coordinates
function positionToCSS(
  position: "left" | "center" | "right" | "background",
  index: number
): { left?: string; right?: string; top?: string; transform?: string } {
  // Vertical variation based on index
  const topVariants = ["38%", "45%", "32%", "52%", "28%"];
  const top = topVariants[index % topVariants.length];

  switch (position) {
    case "left":
      return { left: "8%", top };
    case "center":
      return { left: "50%", top, transform: "translateX(-50%)" };
    case "right":
      return { right: "8%", top };
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
  // Support coordinate-based positioning (story/page.tsx API)
  const posStyle: React.CSSProperties = x !== undefined && y !== undefined
    ? { position: "absolute", left: `${x * 100}%`, top: `${y * 100}%`, transform: "translate(-50%, -50%)" }
    : positionToCSS(position ?? "center", index);
  const handleClick = onTap ? () => onTap(character) : onClick ?? (() => {});
  const effectiveSelected = isActive ?? isSelected;
  const effectiveDelay = delay ?? index * 0.12;
  const relColor = relationshipColor(character.relationshipToUser);
  const relLabel = relationshipLabel(character.relationshipToUser);
  const emoji = getEmoji(character.emotionalState);

  return (
    <motion.button
      className={cn(
        "absolute z-[10] touch-target cursor-pointer",
        "flex flex-col items-center gap-0.5",
        "group"
      )}
      style={posStyle}
      onClick={handleClick}
      initial={{ opacity: 0, scale: 0.6, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.5, y: -8 }}
      transition={{ duration: 0.5, delay: effectiveDelay, type: "spring", stiffness: 200 }}
      whileTap={{ scale: 0.92 }}
      aria-label={`Talk to ${character.name}`}
    >
      {/* Main label pill */}
      <div
        className={cn(
          "px-3 py-1.5 rounded-2xl",
          "glass-story",
          "flex flex-col items-center gap-0.5",
          "transition-all duration-200",
          effectiveSelected
            ? "border-[rgba(200,155,60,0.7)] shadow-[0_0_20px_rgba(200,155,60,0.4)]"
            : "group-hover:border-[rgba(200,155,60,0.5)] group-hover:shadow-[0_0_12px_rgba(123,63,196,0.3)]"
        )}
      >
        {/* Emotion + Name */}
        <div className="flex items-center gap-1.5">
          <span className="text-base leading-none">{emoji}</span>
          <span className="font-display text-[#f0d898] text-sm font-semibold tracking-wide whitespace-nowrap">
            {character.name}
          </span>
        </div>

        {/* Personality */}
        <span className="font-body text-white/60 text-[10px] tracking-wide whitespace-nowrap">
          {character.personality}
        </span>

        {/* Relationship score bar */}
        <div className="flex items-center gap-1.5 mt-0.5 w-full">
          <div className="flex-1 h-0.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700",
                character.relationshipToUser >= 0 ? "bg-rose-400" : "bg-orange-500"
              )}
              style={{ width: `${Math.abs(character.relationshipToUser)}%` }}
            />
          </div>
          <span className={cn("font-mono-dm text-[9px]", relColor)}>
            {relLabel}
          </span>
        </div>
      </div>

      {/* Tap hint */}
      {effectiveSelected && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="font-mono-dm text-[#c89b3c] text-[9px] tracking-widest uppercase mt-0.5"
        >
          TALKING
        </motion.div>
      )}
    </motion.button>
  );
}

export default ObjectLabel;
