"use client";

import { cn } from "@/lib/cn";
import type { Mission } from "@/types";

interface MissionBriefingProps {
  mission: Mission;
  onAccept?: (missionId: string) => void;
  onSkip?: (missionId: string) => void;
  onAcceptMission?: (mission: Mission) => void;
  onDefer?: (mission: Mission) => void;
  className?: string;
}

export function MissionBriefing({ mission, onAccept, onSkip, onAcceptMission, onDefer, className }: MissionBriefingProps) {
  const handleAccept = () => { onAcceptMission?.(mission); onAccept?.(mission.id); };
  const handleSkip = () => { onDefer?.(mission); onSkip?.(mission.id); };

  return (
    <div
      className={cn(className)}
      style={{
        border: "2px solid #3B4CCA",
        background: "rgba(6,8,30,0.98)",
        boxShadow: "4px 4px 0 rgba(59,76,202,0.5)",
      }}
    >
      {/* Window chrome */}
      <div
        className="flex items-center justify-between px-3 py-2"
        style={{ background: "#3B4CCA", borderBottom: "2px solid rgba(255,222,0,0.4)" }}
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-[#FFDE00] animate-pulse2" />
          <span className="font-pixel text-base tracking-wider" style={{ color: "#FFDE00" }}>
            ▸ MISSION BRIEFING
          </span>
        </div>
        <span className="font-pixel text-base" style={{ color: "rgba(255,222,0,0.5)" }}>
          {mission.objectives.length} OBJ
        </span>
      </div>

      <div className="px-4 py-4 flex flex-col gap-3">
        {/* Raw task */}
        <div className="flex items-center gap-2">
          <span className="font-pixel text-base" style={{ color: "rgba(255,255,255,0.25)" }}>
            INPUT:
          </span>
          <span className="font-vt text-lg" style={{ color: "rgba(255,255,255,0.4)" }}>
            {mission.originalTask}
          </span>
        </div>

        {/* Codename */}
        <div>
          <p className="font-pixel text-base mb-1" style={{ color: "rgba(255,222,0,0.4)" }}>
            OPERATION CODENAME
          </p>
          <h3
            className="font-pixel leading-loose"
            style={{ color: "#FFDE00", fontSize: "16px", letterSpacing: "0.08em" }}
          >
            {mission.codename}
          </h3>
        </div>

        {/* Briefing text */}
        <p className="font-vt text-xl leading-snug" style={{ color: "rgba(176,196,255,0.75)" }}>
          {mission.briefing}
        </p>

        {/* Objectives */}
        {mission.objectives.length > 0 && (
          <div
            className="flex flex-col gap-1.5 py-2 px-3"
            style={{ border: "1px solid rgba(59,76,202,0.5)", background: "rgba(6,8,30,0.6)" }}
          >
            <span className="font-pixel text-base mb-1" style={{ color: "rgba(255,222,0,0.4)" }}>
              OBJECTIVES
            </span>
            {mission.objectives.map((obj) => (
              <div key={obj.id} className="flex items-start gap-2">
                <span className="font-pixel text-base mt-0.5" style={{ color: obj.completed ? "#FFDE00" : "rgba(255,222,0,0.35)" }}>
                  {obj.completed ? "■" : "□"}
                </span>
                <span className="font-vt text-xl" style={{ color: obj.completed ? "rgba(176,196,255,0.5)" : "rgba(176,196,255,0.7)" }}>
                  {obj.description}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* XP reward */}
        <div
          className="flex items-center gap-3 px-3 py-2"
          style={{ border: "1px solid rgba(255,222,0,0.2)", background: "rgba(255,222,0,0.05)" }}
        >
          <span className="font-pixel text-base" style={{ color: "#FFDE00" }}>
            +{mission.xpReward} XP
          </span>
          <div className="w-px h-3" style={{ background: "rgba(255,222,0,0.2)" }} />
          <span className="font-pixel text-base tracking-wider" style={{ color: "rgba(255,222,0,0.4)" }}>
            MISSION REWARD
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleAccept}
            className="flex-1 touch-target font-pixel active:translate-x-[2px] active:translate-y-[2px]"
            style={{
              background: "#FFDE00",
              border: "2px solid #1a2880",
              boxShadow: "3px 3px 0 rgba(26,40,128,0.6)",
              color: "#0a0e30",
              fontSize: "11px",
              letterSpacing: "0.08em",
              padding: "12px 8px",
              transition: "box-shadow 0.05s, transform 0.05s",
            }}
          >
            ▶ ACCEPT MISSION
          </button>
          <button
            onClick={handleSkip}
            className="touch-target font-pixel px-4 active:translate-x-[1px] active:translate-y-[1px]"
            style={{
              background: "transparent",
              border: "2px solid rgba(255,255,255,0.15)",
              boxShadow: "2px 2px 0 rgba(255,255,255,0.06)",
              color: "rgba(255,255,255,0.35)",
              fontSize: "11px",
              letterSpacing: "0.08em",
              transition: "box-shadow 0.05s, transform 0.05s",
            }}
          >
            SKIP
          </button>
        </div>
      </div>
    </div>
  );
}

export default MissionBriefing;
