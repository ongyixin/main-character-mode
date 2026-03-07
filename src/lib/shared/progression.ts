// Shared XP / level / streak progression system used by both modes.

import type { ProgressionState, IProgression } from "@/types";
import { LEVEL_THRESHOLDS } from "@/lib/constants";

/** Default progression state — used by session store when creating new sessions */
export function defaultProgression(): ProgressionState {
  return {
    xp: 0,
    level: 1,
    currentStreak: 0,
    longestStreak: 0,
    completedToday: 0,
    badges: [],
  };
}

function xpToLevel(xp: number): number {
  let level = 1;
  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) level = i + 1;
    else break;
  }
  return level;
}

const BADGES: Record<string, { threshold: number; field: keyof ProgressionState }> = {
  "first_blood": { threshold: 1, field: "completedToday" },
  "on_a_roll": { threshold: 3, field: "currentStreak" },
  "week_warrior": { threshold: 7, field: "currentStreak" },
  "centurion": { threshold: 100, field: "xp" },
  "dedicated": { threshold: 500, field: "xp" },
};

// ─── Standalone function exports (used by action/talk routes directly) ────────

/** Award XP and update level. Pure function. */
export function awardXP(state: ProgressionState, amount: number): ProgressionState {
  const newXP = state.xp + amount;
  const newLevel = xpToLevel(newXP);
  const newBadges = [...state.badges];
  for (const [badge, { threshold, field }] of Object.entries(BADGES)) {
    if (!newBadges.includes(badge)) {
      const value = field === "xp" ? newXP : (state[field] as number);
      if (value >= threshold) newBadges.push(badge);
    }
  }
  return { ...state, xp: newXP, level: newLevel, badges: newBadges };
}

/** Record a completed task and bump counters. Pure function. */
export function recordCompletion(state: ProgressionState): ProgressionState {
  return { ...state, completedToday: state.completedToday + 1 };
}

/** XP reward amounts for common game events */
export const XP_REWARDS = {
  scanScene: 5,
  completeObjective: 25,
  completeMission: 100,
  completeStoryQuest: 75,
  interactWithCharacter: 10,
  streakBonus: 50,
  escalationSurvived: 150,
} as const;

// ─── Object-based API (implements IProgression interface) ─────────────────────

export const progression: IProgression = {
  awardXP(state: ProgressionState, amount: number): ProgressionState {
    const newXP = state.xp + amount;
    const newLevel = xpToLevel(newXP);

    // Check new badges
    const newBadges = [...state.badges];
    for (const [badge, { threshold, field }] of Object.entries(BADGES)) {
      if (!newBadges.includes(badge)) {
        const value = field === "xp" ? newXP : (state[field] as number);
        if (value >= threshold) newBadges.push(badge);
      }
    }

    return {
      ...state,
      xp: newXP,
      level: newLevel,
      completedToday: state.completedToday + 1,
      badges: newBadges,
    };
  },

  updateStreak(state: ProgressionState): ProgressionState {
    const newStreak = state.currentStreak + 1;
    return {
      ...state,
      currentStreak: newStreak,
      longestStreak: Math.max(state.longestStreak, newStreak),
    };
  },

  checkLevelUp(state: ProgressionState): { leveled: boolean; newLevel: number } {
    const newLevel = xpToLevel(state.xp);
    return {
      leveled: newLevel > state.level,
      newLevel,
    };
  },
};
