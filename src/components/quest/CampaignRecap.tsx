"use client";

import { cn } from "@/lib/cn";
import type { QuestModeState, ProgressionState } from "@/types";

interface CampaignRecapProps {
  questState: QuestModeState;
  progression: ProgressionState;
  onViewPoster: () => void;
  onNewCampaign: () => void;
  className?: string;
}

/**
 * End-of-session campaign recap for Quest Mode.
 * Links to the full recap poster on the /recap page.
 */
export function CampaignRecap({
  questState,
  progression,
  onViewPoster,
  onNewCampaign,
  className,
}: CampaignRecapProps) {
  const completed = questState.missions.filter((m) => m.status === "completed");
  const totalXP = completed.reduce((sum, m) => sum + m.xpReward, 0);

  return (
    <div className={cn("glass-quest border-glow-quest px-5 py-5 rounded", className)}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <div className="w-2 h-2 rounded-full bg-green-400" />
        <span className="font-mono-dm text-green-400/70 text-[9px] tracking-[0.3em] uppercase">
          Campaign Debrief
        </span>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: "MISSIONS", value: completed.length.toString() },
          { label: "TOTAL XP", value: `+${totalXP}` },
          { label: "STREAK", value: `×${progression.currentStreak}` },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="flex flex-col items-center py-3 px-2 rounded border border-[#00d4ff]/15 bg-[#00d4ff]/5"
          >
            <span className="font-mono-dm text-[#00d4ff] text-xl font-medium">{value}</span>
            <span className="font-mono-dm text-white/30 text-[9px] tracking-widest mt-1">{label}</span>
          </div>
        ))}
      </div>

      {/* Completed missions list */}
      {completed.length > 0 && (
        <div className="flex flex-col gap-1.5 mb-5">
          {completed.slice(0, 4).map((m) => (
            <div key={m.id} className="flex items-center gap-2 text-xs">
              <span className="text-green-400 shrink-0">✓</span>
              <span className="font-mono-dm text-white/60 tracking-wide truncate">{m.codename}</span>
              <span className="font-mono-dm text-[#00d4ff]/50 shrink-0">+{m.xpReward}</span>
            </div>
          ))}
          {completed.length > 4 && (
            <p className="font-mono-dm text-white/30 text-[10px]">+{completed.length - 4} more...</p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-2">
        <button onClick={onViewPoster} className="btn-quest py-3 text-sm w-full">
          VIEW EPISODE POSTER
        </button>
        <button onClick={onNewCampaign} className="btn-ghost py-3 text-sm w-full">
          New Campaign
        </button>
      </div>
    </div>
  );
}
