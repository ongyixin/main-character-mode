"use client";

import { cn } from "@/lib/cn";
import XPBar from "@/components/shared/XPBar";
import { formatDuration } from "@/lib/utils";
import type { ProgressionState, QuestModeState } from "@/types";

interface QuestHUDProps {
  progression: ProgressionState;
  questState: QuestModeState;
  startedAt?: number;
  className?: string;
  // Extended props from quest/page.tsx
  scanState?: string;
  onScanRetry?: () => void;
  onRecap?: () => void;
}

/**
 * Quest Mode heads-up display — mission-control readout.
 * Top overlay showing XP, streak, pending count, and elapsed time.
 */
export function QuestHUD({ progression, questState, startedAt = Date.now(), className, scanState: _scanState, onScanRetry: _onScanRetry, onRecap: _onRecap }: QuestHUDProps) {
  const pending = questState.missions.filter((m) => m.status === "briefed").length;

  return (
    <div
      className={cn(
        "glass-quest border-glow-quest pointer-events-none",
        "px-4 py-3 rounded min-w-[200px]",
        className
      )}
    >
      {/* Status row */}
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono-dm text-[#00d4ff]/60 text-[9px] tracking-[0.25em] uppercase">
          ◉ FIELD OPS
        </span>
        <span className="font-mono-dm text-white/30 text-[10px] tabular-nums">
          T+{formatDuration(startedAt)}
        </span>
      </div>

      {/* XP bar */}
      <XPBar progression={progression} className="mb-2" />

      {/* Bottom row */}
      <div className="flex items-center gap-3">
        {progression.currentStreak > 0 && (
          <span className="font-mono-dm text-[#00d4ff] text-[10px]">
            🔥 ×{progression.currentStreak}
          </span>
        )}
        <span className="font-mono-dm text-white/40 text-[10px]">
          {pending} objective{pending !== 1 ? "s" : ""} queued
        </span>
      </div>
    </div>
  );
}

export default QuestHUD;
