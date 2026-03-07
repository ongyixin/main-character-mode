"use client";

import { cn } from "@/lib/cn";
import { clamp, formatDuration } from "@/lib/utils";
import type { Mission, MomentumState, NarrationEvent } from "@/types";

interface ActiveMissionProps {
  mission: Mission;
  momentum?: MomentumState;
  /** Latest narration event for this mission */
  latestNarration?: NarrationEvent;
  // Original API
  onComplete?: (missionId: string) => void;
  onAbandon?: (missionId: string) => void;
  // Extended API (quest/page.tsx compat)
  onMissionComplete?: (missionId: string) => void;
  onObjectiveComplete?: (missionId: string, objectiveId: string) => void;
  className?: string;
}

/**
 * Active mission card shown while a task is in progress.
 * Quest Agent updates mission objectives, momentum, and narration.
 */
const DEFAULT_MOMENTUM: MomentumState = {
  currentCombo: 0,
  sessionProductivityScore: 50,
  lastActivityAt: Date.now(),
  idlePenaltyTriggered: false,
};

export function ActiveMission({
  mission,
  momentum = DEFAULT_MOMENTUM,
  latestNarration,
  onComplete,
  onAbandon,
  onMissionComplete,
  onObjectiveComplete,
  className,
}: ActiveMissionProps) {
  const handleComplete = () => { onMissionComplete?.(mission.id); onComplete?.(mission.id); };
  const handleAbandon = () => { onAbandon?.(mission.id); };

  const completedObjectives = mission.objectives.filter((o) => o.completed).length;
  const totalObjectives = mission.objectives.length;
  const progressPercent = totalObjectives > 0
    ? Math.round((completedObjectives / totalObjectives) * 100)
    : 0;

  const productivity = clamp(momentum.sessionProductivityScore, 0, 100);

  return (
    <div className={cn("glass-quest border-glow-quest px-4 py-4 rounded", className)}>
      {/* Phase indicator */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#00d4ff] animate-pulse2" />
          <span className="font-mono-dm text-[#00d4ff] text-[9px] tracking-[0.25em]">
            IN PROGRESS
          </span>
        </div>
        {mission.startedAt && (
          <span className="font-mono-dm text-white/30 text-[10px] tabular-nums">
            T+{formatDuration(mission.startedAt)}
          </span>
        )}
      </div>

      {/* Mission codename */}
      <h3 className="font-mono-dm text-[#00d4ff] text-lg font-medium tracking-widest uppercase mb-1 text-glow-quest">
        {mission.codename}
      </h3>
      <p className="font-body text-white/40 text-xs mb-4">← {mission.originalTask}</p>

      {/* Objectives checklist */}
      {mission.objectives.length > 0 && (
        <div className="flex flex-col gap-1 mb-3">
          {mission.objectives.map((obj) => (
            <button
              key={obj.id}
              className="flex items-center gap-2 text-xs text-left w-full"
              onClick={() => !obj.completed && onObjectiveComplete?.(mission.id, obj.id)}
            >
              <span className={obj.completed ? "text-green-400" : "text-[#00d4ff]/40"}>
                {obj.completed ? "✓" : "○"}
              </span>
              <span className={cn("font-mono-dm", obj.completed ? "text-white/30 line-through" : "text-white/60")}>
                {obj.description}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Progress bar */}
      <div className="mb-2">
        <div className="flex justify-between mb-1">
          <span className="font-mono-dm text-[9px] text-white/40 tracking-widest uppercase">
            Progress
          </span>
          <span className="font-mono-dm text-[10px] text-[#00d4ff]/70 tabular-nums">
            {progressPercent}%
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#0066aa] to-[#00d4ff] transition-all duration-1000"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Combo indicator */}
      {momentum.currentCombo > 0 && (
        <p className="font-mono-dm text-yellow-400 text-[10px] mb-2">
          🔥 ×{momentum.currentCombo} COMBO — productivity {productivity}%
        </p>
      )}

      {/* Narrator line */}
      {latestNarration && (
        <p className="font-body text-white/50 text-[11px] italic mb-4 leading-relaxed animate-ticker">
          {latestNarration.text}
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-3 mt-2">
        <button onClick={handleComplete} className="flex-1 btn-quest py-2.5 text-sm">
          MARK DONE
        </button>
        <button
          onClick={handleAbandon}
          className="touch-target px-4 rounded border border-red-500/20 bg-red-500/5 text-red-400/60 font-mono-dm text-xs tracking-widest uppercase"
        >
          ABORT
        </button>
      </div>
    </div>
  );
}

export default ActiveMission;
