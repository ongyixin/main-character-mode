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
  scanState?: string;
  onScanRetry?: () => void;
  onRecap?: () => void;
}

export function QuestHUD({ progression, questState, startedAt = Date.now(), className }: QuestHUDProps) {
  const pending = questState.missions.filter((m) => m.status === "briefed").length;

  return (
    <div
      className={cn("pointer-events-none", className)}
      style={{
        background: "rgba(6,8,30,0.95)",
        border: "2px solid #3B4CCA",
        boxShadow: "3px 3px 0 rgba(59,76,202,0.5)",
        padding: "8px 12px",
        minWidth: 200,
      }}
    >
      {/* Window chrome title */}
      <div
        className="flex items-center justify-between mb-2 pb-1.5"
        style={{ borderBottom: "1px solid rgba(255,222,0,0.15)" }}
      >
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 inline-block animate-pulse2" style={{ background: "#FFDE00" }} />
          <span className="font-pixel text-base tracking-wider" style={{ color: "rgba(255,222,0,0.6)" }}>
            ◉ FIELD OPS
          </span>
        </div>
        <span className="font-mono-dm text-base tabular-nums" style={{ color: "rgba(255,255,255,0.25)" }}>
          T+{formatDuration(startedAt)}
        </span>
      </div>

      {/* XP bar */}
      <XPBar progression={progression} className="mb-2" />

      {/* Stats row */}
      <div className="flex items-center gap-3">
        {progression.currentStreak > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-base">🔥</span>
            <span className="font-pixel text-base" style={{ color: "#FFDE00" }}>
              ×{progression.currentStreak}
            </span>
          </div>
        )}
        <span className="font-pixel text-base" style={{ color: "rgba(255,255,255,0.3)" }}>
          {pending} OBJ QUEUED
        </span>
      </div>
    </div>
  );
}

export default QuestHUD;
