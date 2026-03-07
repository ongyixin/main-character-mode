"use client";

import { useState, useEffect, useCallback } from "react";
import { QuestHUD } from "@/components/quest/QuestHUD";
import { MissionBriefing } from "@/components/quest/MissionBriefing";
import { ActiveMission } from "@/components/quest/ActiveMission";
import TaskInput from "@/components/quest/TaskInput";
import { MomentumMeter } from "@/components/quest/MomentumMeter";
import NarrationBanner from "@/components/shared/NarrationBanner";
import { Camera } from "@/components/shared/Camera";
import { MOCK_QUEST_SESSION } from "@/lib/mock-data";
import { DEMO_MODE } from "@/lib/constants";
import type {
  SessionState,
  CreateSessionRequest,
  CreateSessionResponse,
  AddTaskRequest,
  AddTaskResponse,
  ProgressRequest,
  ProgressResponse,
} from "@/types";

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
 *
 * When DEMO_MODE = true  → initializes from MOCK_QUEST_SESSION; handlers are stubs.
 * When DEMO_MODE = false → creates a real session via POST /api/session; all handlers
 *                          call the live API endpoints (task, progress).
 */
export default function QuestPage() {
  const [session, setSession] = useState<SessionState | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [initLoading, setInitLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Session initialization ──────────────────────────────────────────────────
  useEffect(() => {
    if (DEMO_MODE) {
      setSession(MOCK_QUEST_SESSION);
      setSessionId(MOCK_QUEST_SESSION.id);
      setInitLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: "quest" } as CreateSessionRequest),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: CreateSessionResponse = await res.json();
        if (!cancelled) {
          setSession(data.initialState);
          setSessionId(data.sessionId);
        }
      } catch (err) {
        console.error("[Quest] Session init failed:", err);
      } finally {
        if (!cancelled) setInitLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ── Derive quest state ──────────────────────────────────────────────────────
  const questState = session?.questState ?? null;
  const activeMission = questState?.missions.find((m) => m.status === "active") ?? null;
  const briefedMission = questState?.missions.find((m) => m.status === "briefed") ?? null;
  const latestNarration = session?.narrativeLog[session.narrativeLog.length - 1] ?? null;

  const [phase, setPhase] = useState<UIPhase>("input");

  // Sync phase with session state after init
  useEffect(() => {
    if (!session) return;
    if (activeMission) setPhase("active");
    else if (briefedMission) setPhase("briefing");
    else setPhase("input");
  }, [session?.id]); // only on session ID change (initial load), not on every mutation

  // ── Task submit ─────────────────────────────────────────────────────────────
  const handleTaskSubmit = useCallback(async (taskText: string) => {
    setIsSubmitting(true);
    if (DEMO_MODE) {
      console.log("[Quest] submit task:", taskText);
      await new Promise((r) => setTimeout(r, 500));
      setIsSubmitting(false);
      setPhase("briefing");
      return;
    }
    if (!sessionId) { setIsSubmitting(false); return; }
    try {
      const res = await fetch("/api/task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, taskText } as AddTaskRequest),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: AddTaskResponse = await res.json();
      setSession((prev) =>
        prev?.questState
          ? {
              ...prev,
              questState: {
                ...prev.questState,
                missions: [...prev.questState.missions, data.mission],
              },
            }
          : prev
      );
      setPhase("briefing");
    } catch (err) {
      console.error("[Quest] Task submit failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  }, [sessionId]);

  // ── Accept mission ──────────────────────────────────────────────────────────
  const handleAcceptMission = useCallback(async (missionId: string) => {
    if (DEMO_MODE) {
      console.log("[Quest] accept mission:", missionId);
      setPhase("active");
      return;
    }
    if (!sessionId) return;
    try {
      const res = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          missionId,
          signal: "context_detected",
        } as ProgressRequest),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: ProgressResponse = await res.json();
      setSession((prev) =>
        prev?.questState
          ? {
              ...prev,
              questState: { ...prev.questState, ...data.update },
              narrativeLog: data.narration
                ? [...prev.narrativeLog, data.narration]
                : prev.narrativeLog,
            }
          : prev
      );
    } catch (err) {
      console.error("[Quest] Accept mission failed:", err);
    }
    setPhase("active");
  }, [sessionId]);

  // ── Skip mission ────────────────────────────────────────────────────────────
  const handleSkipMission = useCallback((missionId: string) => {
    console.log("[Quest] skip mission:", missionId);
    setPhase("input");
  }, []);

  // ── Complete mission ────────────────────────────────────────────────────────
  const handleComplete = useCallback(async (missionId: string) => {
    if (DEMO_MODE) {
      console.log("[Quest] complete:", missionId);
      setPhase("done");
      return;
    }
    if (!sessionId) return;
    try {
      const res = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          missionId,
          signal: "mission_complete",
        } as ProgressRequest),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: ProgressResponse = await res.json();
      setSession((prev) =>
        prev?.questState
          ? {
              ...prev,
              questState: { ...prev.questState, ...data.update },
              narrativeLog: data.narration
                ? [...prev.narrativeLog, data.narration]
                : prev.narrativeLog,
            }
          : prev
      );
    } catch (err) {
      console.error("[Quest] Complete mission failed:", err);
    }
    setPhase("done");
  }, [sessionId]);

  // ── Abandon mission ─────────────────────────────────────────────────────────
  const handleAbandon = useCallback(async (missionId: string) => {
    if (DEMO_MODE) {
      console.log("[Quest] abandon:", missionId);
      setPhase("input");
      return;
    }
    if (!sessionId) return;
    try {
      const res = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          missionId,
          signal: "mission_abandon",
        } as ProgressRequest),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: ProgressResponse = await res.json();
      setSession((prev) =>
        prev?.questState
          ? {
              ...prev,
              questState: { ...prev.questState, ...data.update },
              narrativeLog: data.narration
                ? [...prev.narrativeLog, data.narration]
                : prev.narrativeLog,
            }
          : prev
      );
    } catch (err) {
      console.error("[Quest] Abandon mission failed:", err);
    }
    setPhase("input");
  }, [sessionId]);

  // ── Loading state ───────────────────────────────────────────────────────────
  if (initLoading || !session || !questState) {
    return (
      <div
        className="relative h-full w-full flex items-center justify-center"
        style={{ background: "var(--quest-bg)" }}
      >
        <div
          className="border-2 px-8 py-6 text-center"
          style={{
            borderColor: "#3B4CCA",
            boxShadow: "4px 4px 0 rgba(59,76,202,0.5)",
            background: "rgba(6,8,30,0.95)",
          }}
        >
          <p className="font-pixel text-base animate-pulse2" style={{ color: "#FFDE00" }}>
            LOADING...
          </p>
        </div>
      </div>
    );
  }

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
          progression={session.progression}
          questState={questState}
          startedAt={session.startedAt}
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
