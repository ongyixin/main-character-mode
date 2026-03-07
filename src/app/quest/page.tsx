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
 * Quest Mode page shell — tactical pixel-retro overlay.
 *
 * Layer stack (bottom → top):
 *   0. Camera feed
 *   1. Dark tactical overlay
 *   2. HUD + MomentumMeter
 *   3. Main content (briefing / active / task input)
 *   4. NarrationBanner (top)
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
    setIsSubmitting(true);
    console.log("[Quest] submit task:", taskText);
    await new Promise((r) => setTimeout(r, 500));
    setIsSubmitting(false);
    setPhase("briefing");
  };

  const handleAcceptMission = (missionId: string) => {
    console.log("[Quest] accept mission:", missionId);
    setPhase("active");
  };

  const handleSkipMission = (missionId: string) => {
    console.log("[Quest] skip mission:", missionId);
    setPhase("input");
  };

  const handleComplete = (missionId: string) => {
    console.log("[Quest] complete:", missionId);
    setPhase("done");
  };

  const handleAbandon = (missionId: string) => {
    console.log("[Quest] abandon:", missionId);
    setPhase("input");
  };

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{ background: "var(--quest-bg)" }}
    >
      {/* Layer 0: Camera feed */}
      <div className="absolute inset-0 z-0">
        <Camera className="w-full h-full object-cover opacity-25" mode="quest" />
      </div>

      {/* Layer 1: Tactical dark overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          background:
            "radial-gradient(ellipse at 20% 80%, rgba(59,76,202,0.25) 0%, transparent 55%), " +
            "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 30%, rgba(0,0,0,0.7) 100%)",
        }}
      />
      {/* Scanlines */}
      <div
        className="absolute inset-0 pointer-events-none z-[2]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.08) 3px, rgba(0,0,0,0.08) 4px)",
        }}
      />

      {/* Layer 2: HUD */}
      <div className="absolute top-0 left-0 z-[20] safe-top px-3 py-3">
        <QuestHUD
          progression={sessionState.progression}
          questState={questState}
          startedAt={sessionState.startedAt}
        />
      </div>

      {/* Momentum meter (right side, active mission only) */}
      {activeMission && phase === "active" && (
        <div className="absolute top-1/2 right-3 z-[20] -translate-y-1/2">
          <MomentumMeter momentum={questState.momentum} />
        </div>
      )}

      {/* Abort button */}
      <div className="absolute top-0 right-0 z-[20] safe-top px-3 py-3">
        <a
          href="/"
          className="flex items-center touch-target"
          style={{
            background: "rgba(6,8,30,0.92)",
            border: "2px solid #3B4CCA",
            padding: "6px 12px",
            boxShadow: "2px 2px 0 rgba(59,76,202,0.5)",
          }}
        >
          <span className="font-pixel text-base" style={{ color: "rgba(255,222,0,0.6)" }}>
            ← ABORT
          </span>
        </a>
      </div>

      {/* Layer 3: Main content */}
      <div className="absolute inset-0 z-[10] flex flex-col justify-end safe-bottom pb-20 px-3 gap-3">
        {phase === "input" && (
          <TaskInput
            onSubmit={handleTaskSubmit}
            isLoading={isSubmitting}
            placeholder="Enter mission (do laundry, reply to emails...)"
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
          <div
            className="text-center"
            style={{
              border: "2px solid #FFDE00",
              background: "rgba(6,8,30,0.98)",
              boxShadow: "4px 4px 0 rgba(59,76,202,0.6)",
              padding: "20px 16px",
            }}
          >
            {/* Window chrome */}
            <div
              className="flex items-center justify-center gap-2 mb-4 pb-3"
              style={{ borderBottom: "1px solid rgba(255,222,0,0.2)" }}
            >
              <span className="font-pixel text-base animate-blink" style={{ color: "#FFDE00" }}>
                ★
              </span>
              <span className="font-pixel text-base" style={{ color: "#FFDE00" }}>
                MISSION COMPLETE
              </span>
              <span className="font-pixel text-base animate-blink" style={{ color: "#FFDE00" }}>
                ★
              </span>
            </div>
            <p className="font-vt text-lg mb-4" style={{ color: "rgba(176,196,255,0.7)" }}>
              Objective achieved. Well done, operative.
            </p>
            <a
              href="/recap?mode=quest"
              className="inline-flex items-center gap-2 font-pixel touch-target px-5 py-3"
              style={{
                background: "#FFDE00",
                border: "2px solid #1a2880",
                boxShadow: "3px 3px 0 rgba(26,40,128,0.6)",
                color: "#0a0e30",
                fontSize: "11px",
                letterSpacing: "0.08em",
              }}
            >
              VIEW DEBRIEF ▶
            </a>
          </div>
        )}
      </div>

      {/* Layer 4: Narration banner */}
      <div className="absolute top-0 left-0 right-0 z-[30] safe-top pt-16 px-3">
        <NarrationBanner event={latestNarration} mode="quest" />
      </div>

      {/* Pixel corner brackets */}
      <TacticalCorners />
    </div>
  );
}

function TacticalCorners() {
  const color = "rgba(255,222,0,0.35)";
  return (
    <div className="absolute inset-3 pointer-events-none z-[5]" aria-hidden>
      <div className="absolute top-0 left-0 w-5 h-5" style={{ borderTop: `2px solid ${color}`, borderLeft: `2px solid ${color}` }} />
      <div className="absolute top-0 left-0 w-2 h-2" style={{ background: color }} />
      <div className="absolute top-0 right-0 w-5 h-5" style={{ borderTop: `2px solid ${color}`, borderRight: `2px solid ${color}` }} />
      <div className="absolute top-0 right-0 w-2 h-2" style={{ background: color }} />
      <div className="absolute bottom-0 left-0 w-5 h-5" style={{ borderBottom: `2px solid ${color}`, borderLeft: `2px solid ${color}` }} />
      <div className="absolute bottom-0 left-0 w-2 h-2" style={{ background: color }} />
      <div className="absolute bottom-0 right-0 w-5 h-5" style={{ borderBottom: `2px solid ${color}`, borderRight: `2px solid ${color}` }} />
      <div className="absolute bottom-0 right-0 w-2 h-2" style={{ background: color }} />
    </div>
  );
}
