"use client";

import { useState } from "react";
import { QuestHUD } from "@/components/quest/QuestHUD";
import { MissionBriefing } from "@/components/quest/MissionBriefing";
import { ActiveMission } from "@/components/quest/ActiveMission";
import TaskInput from "@/components/quest/TaskInput";
import { MomentumMeter } from "@/components/quest/MomentumMeter";
import NarrationBanner from "@/components/shared/NarrationBanner";
import { Camera } from "@/components/shared/Camera";
import { MOCK_QUEST_SESSION } from "@/lib/mock-data";
import type { SessionState } from "@/types";

type UIPhase = "input" | "briefing" | "active" | "done";

/**
 * Quest Mode page shell.
 *
 * Layer stack (bottom → top):
 *   0. Camera feed
 *   1. Cold dark gradient overlay
 *   2. HUD + MomentumMeter
 *   3. Main content (briefing / active / task input)
 *   4. NarrationBanner (bottom)
 *
 * Quest Agent replaces mock state with live state from /api/session, /api/task, /api/progress.
 */
export default function QuestPage() {
  const [session] = useState<SessionState>(MOCK_QUEST_SESSION);

  const sessionState = session as import("@/types").SessionState;
  const questState = sessionState.questState!;
  const activeMission = questState.missions.find((m: import("@/types").Mission) => m.status === "active") ?? null;
  const briefedMission = questState.missions.find((m: import("@/types").Mission) => m.status === "briefed") ?? null;
  const latestNarration = sessionState.narrativeLog[sessionState.narrativeLog.length - 1] ?? null;

  const [phase, setPhase] = useState<UIPhase>(
    activeMission ? "active" : briefedMission ? "briefing" : "input"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTaskSubmit = async (taskText: string) => {
    // Quest Agent: POST /api/task with { sessionId, taskText }
    setIsSubmitting(true);
    console.log("[Quest] submit task:", taskText);
    await new Promise((r) => setTimeout(r, 500)); // mock latency
    setIsSubmitting(false);
    setPhase("briefing");
  };

  const handleAcceptMission = (missionId: string) => {
    // Quest Agent: POST /api/progress { signal: "context_detected" }
    console.log("[Quest] accept mission:", missionId);
    setPhase("active");
  };

  const handleSkipMission = (missionId: string) => {
    console.log("[Quest] skip mission:", missionId);
    setPhase("input");
  };

  const handleComplete = (missionId: string) => {
    // Quest Agent: POST /api/progress { signal: "mission_complete" }
    console.log("[Quest] complete:", missionId);
    setPhase("done");
  };

  const handleAbandon = (missionId: string) => {
    // Quest Agent: POST /api/progress { signal: "mission_abandon" }
    console.log("[Quest] abandon:", missionId);
    setPhase("input");
  };

  return (
    <div className="relative h-full w-full overflow-hidden" style={{ background: "var(--quest-bg)" }}>
      {/* Layer 0: Camera feed — renders full-screen via absolute positioning */}
      <div className="absolute inset-0 z-0">
        <Camera className="w-full h-full object-cover opacity-30" mode="quest" />
      </div>

      {/* Layer 1: Atmosphere overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          background:
            "radial-gradient(ellipse at 20% 80%, rgba(0,102,170,0.3) 0%, transparent 55%), " +
            "radial-gradient(ellipse at 80% 20%, rgba(0,212,255,0.1) 0%, transparent 55%), " +
            "linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 30%, rgba(0,0,0,0.7) 100%)",
        }}
      />

      {/* Layer 2: HUD */}
      <div className="absolute top-0 left-0 z-[20] safe-top px-4 py-3">
        <QuestHUD
          progression={sessionState.progression}
          questState={questState}
          startedAt={sessionState.startedAt}
        />
      </div>

      {/* Momentum meter (right side, active mission only) */}
      {activeMission && phase === "active" && (
        <div className="absolute top-1/2 right-4 z-[20] -translate-y-1/2">
          <MomentumMeter momentum={questState.momentum} />
        </div>
      )}

      {/* Back button */}
      <div className="absolute top-0 right-0 z-[20] safe-top px-4 py-3">
        <a
          href="/"
          className="glass-quest rounded px-3 py-2 font-mono-dm text-[#00d4ff]/50 text-[10px] tracking-widest uppercase touch-target block"
        >
          ← ABORT
        </a>
      </div>

      {/* Layer 3: Main content */}
      <div className="absolute inset-0 z-[10] flex flex-col justify-end safe-bottom pb-20 px-4 gap-3">
        {phase === "input" && (
          <TaskInput
            onSubmit={handleTaskSubmit}
            isLoading={isSubmitting}
            placeholder="Add a mission (do laundry, reply to emails...)"
          />
        )}

        {phase === "briefing" && briefedMission && (
          <MissionBriefing
            mission={briefedMission}
            onAccept={handleAcceptMission}
            onSkip={handleSkipMission}
          />
        )}

        {phase === "active" && activeMission && (
          <ActiveMission
            mission={activeMission}
            momentum={questState.momentum}
            latestNarration={latestNarration ?? undefined}
            onComplete={handleComplete}
            onAbandon={handleAbandon}
          />
        )}

        {phase === "done" && (
          <div className="glass-quest border-glow-quest px-5 py-5 rounded text-center">
            <p className="font-mono-dm text-green-400 text-sm tracking-widest uppercase mb-3">
              ✓ Mission Complete
            </p>
            <a href="/recap?mode=quest" className="btn-quest py-3 px-6 inline-block text-sm">
              VIEW DEBRIEF →
            </a>
          </div>
        )}
      </div>

      {/* Layer 4: Narration banner */}
      <div className="absolute bottom-0 left-0 right-0 z-[30] safe-bottom pb-2">
        <NarrationBanner event={latestNarration} />
      </div>

      {/* Tactical corners */}
      <TacticalCorners />
    </div>
  );
}

function TacticalCorners() {
  return (
    <div className="absolute inset-3 pointer-events-none z-[5]" aria-hidden>
      <div className="absolute top-0 left-0 w-5 h-5 border-t border-l border-[#00d4ff]/20" />
      <div className="absolute top-0 right-0 w-5 h-5 border-t border-r border-[#00d4ff]/20" />
      <div className="absolute bottom-0 left-0 w-5 h-5 border-b border-l border-[#00d4ff]/20" />
      <div className="absolute bottom-0 right-0 w-5 h-5 border-b border-r border-[#00d4ff]/20" />
    </div>
  );
}
