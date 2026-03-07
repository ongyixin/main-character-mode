// Momentum Tracker — Quest Mode
// Tracks combos, idle detection, and session productivity score.
// OWNER: Quest Mode Agent

import type { MomentumState, Mission } from "@/types";

const IDLE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

// Not typed as IMomentumTracker to allow extra convenience methods
export const momentumTracker = {
  recordActivity(state: MomentumState): MomentumState {
    return {
      ...state,
      lastActivityAt: Date.now(),
      idlePenaltyTriggered: false,
    };
  },

  recordObjectiveComplete(state: MomentumState): MomentumState {
    const newCombo = state.currentCombo + 1;
    // Productivity score increases logarithmically with combo
    const boost = Math.min(10, 5 + Math.log2(newCombo + 1) * 2);
    return {
      ...state,
      currentCombo: newCombo,
      sessionProductivityScore: Math.min(100, state.sessionProductivityScore + boost),
      lastActivityAt: Date.now(),
      idlePenaltyTriggered: false,
    };
  },

  checkIdle(state: MomentumState, thresholdMs: number = IDLE_THRESHOLD_MS): boolean {
    return Date.now() - state.lastActivityAt > thresholdMs;
  },

  computeProductivityScore(state: MomentumState, missions: Mission[]): number {
    const completed = missions.filter((m) => m.status === "completed").length;
    const total = missions.length;
    if (total === 0) return state.sessionProductivityScore;

    const completionRatio = completed / total;
    const comboBonus = Math.min(20, state.currentCombo * 2);
    const base = Math.round(completionRatio * 80);
    return Math.min(100, base + comboBonus);
  },

  recordMissionComplete(state: MomentumState): MomentumState {
    return {
      ...state,
      sessionProductivityScore: Math.min(100, state.sessionProductivityScore + 20),
      lastActivityAt: Date.now(),
      idlePenaltyTriggered: false,
    };
  },

  applyIdlePenalty(state: MomentumState): MomentumState {
    return {
      ...state,
      sessionProductivityScore: Math.max(0, state.sessionProductivityScore - 15),
      idlePenaltyTriggered: true,
      currentCombo: 0,
    };
  },

  breakCombo(state: MomentumState): MomentumState {
    return { ...state, currentCombo: 0 };
  },
};

// ─── Named function exports (used by progress/route.ts) ──────────────────────

export function recordObjectiveComplete(state: MomentumState): MomentumState {
  return momentumTracker.recordObjectiveComplete(state);
}
export function recordMissionComplete(state: MomentumState): MomentumState {
  return momentumTracker.recordMissionComplete(state);
}
export function applyIdlePenalty(state: MomentumState): MomentumState {
  return momentumTracker.applyIdlePenalty(state);
}
export function breakCombo(state: MomentumState): MomentumState {
  return momentumTracker.breakCombo(state);
}
export function recordActivity(state: MomentumState): MomentumState {
  return momentumTracker.recordActivity(state);
}
