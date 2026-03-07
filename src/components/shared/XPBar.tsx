"use client";
// XP and level display — shared by both modes
// OWNER: Shared / Frontend Agent

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
}

export { XPBar };
export default function XPBar({ progression, className = "" }: XPBarProps) {
  const progress = xpProgressInLevel(progression);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-xs font-mono text-white/60">LV {progression.level}</span>
      <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-white/70 rounded-full transition-all duration-700"
          style={{ width: `${Math.min(100, progress * 100)}%` }}
        />
      </div>
      <span className="text-xs font-mono text-white/40">{progression.xp} XP</span>
    </div>
  );
}
