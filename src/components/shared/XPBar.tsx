"use client";

import type { ProgressionState } from "@/types";
import { LEVEL_THRESHOLDS } from "@/lib/constants";

function xpProgressInLevel(state: ProgressionState): number {
  const levelStart = LEVEL_THRESHOLDS[state.level - 1] ?? 0;
  const levelEnd = LEVEL_THRESHOLDS[state.level] ?? levelStart + 1000;
  return (state.xp - levelStart) / (levelEnd - levelStart);
}

interface XPBarProps {
  progression: ProgressionState;
  className?: string;
  mode?: "story" | "quest";
}

const SEGMENTS = 10;

export { XPBar };
export default function XPBar({ progression, className = "", mode = "quest" }: XPBarProps) {
  const progress = xpProgressInLevel(progression);
  const filledSegs = Math.round(Math.min(1, progress) * SEGMENTS);
  const isStory = mode === "story";
  const color = isStory ? "#FFDE00" : "#FFDE00";
  const borderColor = isStory ? "rgba(255,222,0,0.4)" : "rgba(255,222,0,0.4)";

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Level */}
      <span className="font-pixel text-base shrink-0" style={{ color }}>
        LV{progression.level}
      </span>

      {/* Segmented bar */}
      <div className="flex-1 flex gap-[2px]">
        {Array.from({ length: SEGMENTS }).map((_, i) => (
          <div
            key={i}
            className="flex-1 h-2.5 transition-all duration-500"
            style={{
              border: `1px solid ${i < filledSegs ? color : borderColor}`,
              background: i < filledSegs ? color : "transparent",
            }}
          />
        ))}
      </div>

      {/* XP number */}
      <span className="font-pixel text-base shrink-0 tabular-nums" style={{ color: isStory ? "rgba(255,222,0,0.5)" : "rgba(255,222,0,0.5)" }}>
        {progression.xp}XP
      </span>
    </div>
  );
}
