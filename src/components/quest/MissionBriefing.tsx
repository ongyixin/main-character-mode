"use client";

import { cn } from "@/lib/cn";
import type { Mission } from "@/types";

interface MissionBriefingProps {
  mission: Mission;
  // Original API
  onAccept?: (missionId: string) => void;
  onSkip?: (missionId: string) => void;
  // Extended API (quest/page.tsx compat — passes full mission object)
  onAcceptMission?: (mission: Mission) => void;
  onDefer?: (mission: Mission) => void;
  className?: string;
}

/**
 * Mission briefing card — shown before a quest task begins.
 * Quest Agent wires onAccept to POST /api/progress with signal: "mission_complete".
 */
export function MissionBriefing({ mission, onAccept, onSkip, onAcceptMission, onDefer, className }: MissionBriefingProps) {
  const handleAccept = () => { onAcceptMission?.(mission); onAccept?.(mission.id); };
  const handleSkip = () => { onDefer?.(mission); onSkip?.(mission.id); };
  return (
    <div className={cn("glass-quest border-glow-quest px-5 py-5 rounded", className)}>
      {/* Classification header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-[#00d4ff] animate-pulse2" />
        <span className="font-mono-dm text-[#00d4ff]/60 text-[9px] tracking-[0.3em] uppercase">
          Mission Briefing
        </span>
        <div className="flex-1 h-px bg-[#00d4ff]/15" />
        <span className="font-mono-dm text-white/30 text-[9px]">
          {mission.objectives.length} OBJ
        </span>
      </div>

      {/* Original task (raw) */}
      <p className="font-mono-dm text-white/30 text-[10px] mb-1 tracking-wide">
        ← {mission.originalTask}
      </p>

      {/* Mission codename */}
      <h3 className="font-mono-dm text-[#00d4ff] text-xl font-medium tracking-widest uppercase mb-3 text-glow-quest leading-tight">
        {mission.codename}
      </h3>

      {/* Mission briefing */}
      <p className="font-body text-white/60 text-sm leading-relaxed mb-4">
        {mission.briefing}
      </p>

      {/* Objectives */}
      {mission.objectives.length > 0 && (
        <div className="flex flex-col gap-1.5 mb-4">
          {mission.objectives.map((obj) => (
            <div key={obj.id} className="flex items-center gap-2 text-xs font-mono-dm text-white/50">
              <span className={obj.completed ? "text-green-400" : "text-[#00d4ff]/40"}>
                {obj.completed ? "✓" : "○"}
              </span>
              <span>{obj.description}</span>
            </div>
          ))}
        </div>
      )}

      {/* Reward row */}
      <div className="flex items-center gap-3 mb-5 px-3 py-2 rounded border border-[#00d4ff]/15 bg-[#00d4ff]/5">
        <span className="font-mono-dm text-[#00d4ff] text-sm font-medium">+{mission.xpReward} XP</span>
        <div className="h-3 w-px bg-[#00d4ff]/20" />
        <span className="font-mono-dm text-white/40 text-xs tracking-widest">MISSION REWARD</span>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={handleAccept} className="flex-1 btn-quest py-3 text-sm">
          ACCEPT MISSION
        </button>
        <button
          onClick={handleSkip}
          className="touch-target px-4 rounded border border-white/10 bg-white/5 text-white/40 font-mono-dm text-xs tracking-widest uppercase"
        >
          SKIP
        </button>
      </div>
    </div>
  );
}

export default MissionBriefing;
