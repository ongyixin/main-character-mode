import type { ActiveMode, StoryGenre, MusicMood, MomentumState } from "@/types";
import { LEVEL_THRESHOLDS, MOMENTUM_IDLE_THRESHOLD_MS } from "./constants";

/** Generate a simple unique session ID */
export function generateSessionId(mode: ActiveMode): string {
  return `${mode}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** XP progress within the current level, 0-1 */
export function xpProgressInLevel(xp: number, level: number): number {
  const current = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const next = LEVEL_THRESHOLDS[level] ?? current + 1000;
  return Math.min((xp - current) / (next - current), 1);
}

/** Format elapsed ms as mm:ss */
export function formatDuration(startedAt: number): string {
  const seconds = Math.floor((Date.now() - startedAt) / 1000);
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

/** Pick a random item from an array */
export function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Returns true if the momentum state is currently considered idle */
export function isIdle(state: MomentumState, thresholdMs = MOMENTUM_IDLE_THRESHOLD_MS): boolean {
  return Date.now() - state.lastActivityAt > thresholdMs;
}

/** Clamp a number between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Build a URL for a mode page */
export function modeUrl(mode: ActiveMode, genre?: StoryGenre): string {
  const base = `/${mode}`;
  return genre ? `${base}?genre=${genre}` : base;
}

/** Map session phase/state to a Lyria music mood signal */
export function deriveStoryMood(phase: string, relationshipAvg: number): MusicMood {
  if (phase === "escalation" || phase === "climax") return "suspenseful";
  if (phase === "quest_active") return "driving";
  if (relationshipAvg > 50) return "romantic";
  if (relationshipAvg < -30) return "chaotic";
  return "neutral";
}

export function deriveQuestMood(combo: number, productivityScore: number): MusicMood {
  if (combo >= 5 || productivityScore > 80) return "triumphant";
  if (combo >= 3 || productivityScore > 50) return "driving";
  if (productivityScore < 20) return "ambient";
  return "focused";
}
