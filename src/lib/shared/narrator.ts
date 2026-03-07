/**
 * Dynamic narration generator — shared by both modes.
 * Uses safeGenerateJSON for AI-powered lines; all paths have deterministic fallbacks.
 */

import { v4 as uuid } from "uuid";
import { safeGenerateJSON } from "./gemini";
import { missionNarrationPrompt, narratorEventPrompt } from "./prompts";
import type {
  NarrationEvent,
  NarrationTone,
  ActiveMode,
  SceneGraph,
} from "@/types";

// ─── Fallback pools ───────────────────────────────────────────────────────────

const QUEST_FALLBACKS: Record<string, string[]> = {
  objective_complete: [
    "Objective secured. Advancing.",
    "Mark one off the manifest. Proceed.",
    "Confirmed. One less variable.",
    "Progress logged. Momentum holding.",
  ],
  mission_complete: [
    "Mission complete. All objectives neutralised.",
    "Operation concluded. XP disbursed.",
    "The work is done. The record will reflect this.",
    "Campaign status: nominal. Stand by for next briefing.",
  ],
  context_detected: [
    "Mission is live. Objectives are active. Clock is running.",
    "Briefing accepted. Deploying to field.",
    "Operation is go. Engage.",
  ],
  idle_detected: [
    "Command has noted the silence. Status report requested.",
    "Activity threshold breached. Recalibrating expectations.",
    "The mission doesn't pause because you did.",
  ],
  mission_abandon: [
    "Operation suspended. The laundry will remember this.",
    "Mission scrubbed. Note filed.",
    "Withdrawal confirmed. Tactical retreat logged.",
  ],
};

const STORY_FALLBACKS: string[] = [
  "Something has shifted. The room knows it too.",
  "The silence grew heavier. That never means nothing.",
  "Objects observe. They are patient.",
  "Analysis complete. You're still here.",
];

const SCAN_FALLBACKS: Record<ActiveMode, string[]> = {
  quest: [
    "Environment logged. Mission parameters updated.",
    "Scene analysis complete. Conditions nominal.",
    "Field scan processed. Intel current.",
  ],
  story: [
    "Something stirs. The room has taken notice.",
    "The atmosphere has shifted. Proceed carefully.",
    "Entities catalogued. Relationships unclear.",
  ],
};

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function fallbackQuestNarration(event: string): string {
  const key = Object.keys(QUEST_FALLBACKS).find((k) =>
    event.toLowerCase().includes(k)
  );
  return pickRandom(key ? QUEST_FALLBACKS[key] : QUEST_FALLBACKS.context_detected);
}

// ─── Tone inference ───────────────────────────────────────────────────────────

export function inferTone(
  mode: ActiveMode,
  sceneType: string,
  mood: string
): NarrationTone {
  if (mode === "quest") return "field_dispatch";
  const m = mood.toLowerCase();
  if (m.includes("chaotic") || m.includes("unstable")) return "chaotic";
  if (m.includes("tense") || m.includes("sinister")) return "dramatic";
  if (sceneType.toLowerCase().includes("office")) return "deadpan";
  return "dramatic";
}

// ─── Quest narration ──────────────────────────────────────────────────────────

type MissionNarrationEvent =
  | "mission_start"
  | "objective_complete"
  | "mission_complete"
  | "idle"
  | "combo";

const EVENT_TYPE_MAP: Record<string, MissionNarrationEvent> = {
  context_detected: "mission_start",
  mission_abandon: "idle",
  objective_complete: "objective_complete",
  mission_complete: "mission_complete",
  idle_detected: "idle",
  high_combo: "combo",
};

export async function generateQuestNarration(
  event: string,
  missionCodename: string,
  combo: number,
  productivityScore: number
): Promise<NarrationEvent> {
  const eventType: MissionNarrationEvent =
    EVENT_TYPE_MAP[event] ?? "mission_start";

  interface Out { text: string; tone: string }
  const output = await safeGenerateJSON<Out>(
    missionNarrationPrompt(eventType, missionCodename, combo, productivityScore)
  );

  return {
    id: uuid(),
    text: output?.text ?? fallbackQuestNarration(event),
    tone: (output?.tone as NarrationTone) ?? "mission_control",
    timestamp: Date.now(),
    sourceMode: "quest",
  };
}

// ─── Generic narration ────────────────────────────────────────────────────────

export interface GenerateNarrationInput {
  tone: NarrationTone;
  sceneType: string;
  mood: string;
  event: string;
}

const TONE_FALLBACKS: Record<NarrationTone, string[]> = {
  dramatic: [
    "Something has shifted. The room knows it too.",
    "The silence grew heavier. That never means nothing.",
  ],
  documentary: [
    "The human surveys the environment with mild uncertainty.",
    "Objects observe. They are patient.",
  ],
  deadpan: [
    "Scene scanned. Nothing exploded.",
    "Analysis complete. You're still here.",
  ],
  chaotic: [
    "EVERYTHING IS RELEVANT AND NOTHING IS STABLE.",
    "Pattern detected: you are here. Consequences: unknown.",
  ],
  cinematic_briefing: [
    "Sector scanned. No threats identified. Proceed.",
    "Environment catalogued. Mission parameters updated.",
  ],
  mission_control: [
    "Field scan processed. Awaiting operative response.",
    "Conditions nominal. Command standing by.",
  ],
  field_dispatch: [
    "Situation assessed. All clear.",
    "Location intel confirmed. Proceed with caution.",
  ],
};

export async function generateNarration(
  input: GenerateNarrationInput
): Promise<NarrationEvent> {
  const pool = TONE_FALLBACKS[input.tone] ?? TONE_FALLBACKS.dramatic;
  let hash = 0;
  for (const c of input.event + input.sceneType) {
    hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff;
  }
  const fallbackText = pool[Math.abs(hash) % pool.length];

  const prompt = `You are a game narrator. Generate a single narration line (max 20 words).
Tone: ${input.tone}. Scene: ${input.sceneType}, mood: ${input.mood}. Event: ${input.event}.
Return only the line. No quotes.`;

  const output = await safeGenerateJSON<{ text: string }>(prompt);
  const text = output?.text?.trim() ?? fallbackText;

  return {
    id: uuid(),
    text,
    tone: input.tone,
    timestamp: Date.now(),
    sourceMode: "story",
  };
}

// ─── Scan narration ───────────────────────────────────────────────────────────

export async function narrateScan(
  sceneGraph: SceneGraph,
  mode: ActiveMode
): Promise<NarrationEvent> {
  const context = `${sceneGraph.sceneType} — ${sceneGraph.spatialContext}`;
  const event = mode === "quest" ? "environment scanned" : "room scanned";

  interface Out { text: string; tone: string }
  const output = await safeGenerateJSON<Out>(
    narratorEventPrompt(event, mode, context)
  );

  if (output?.text) {
    return {
      id: uuid(),
      text: output.text,
      tone: (output.tone as NarrationTone) ?? (mode === "quest" ? "field_dispatch" : "dramatic"),
      timestamp: Date.now(),
      sourceMode: mode,
    };
  }

  return {
    id: uuid(),
    text: pickRandom(SCAN_FALLBACKS[mode]),
    tone: mode === "quest" ? "field_dispatch" : "dramatic",
    timestamp: Date.now(),
    sourceMode: mode,
  };
}

// ─── Synchronous helpers ──────────────────────────────────────────────────────

export function instantNarration(
  event: string,
  mode: ActiveMode = "quest"
): NarrationEvent {
  const text =
    mode === "quest"
      ? fallbackQuestNarration(event)
      : pickRandom(STORY_FALLBACKS);
  return {
    id: uuid(),
    text,
    tone: mode === "quest" ? "mission_control" : "dramatic",
    timestamp: Date.now(),
    sourceMode: mode,
  };
}

export const narrator = {
  generateQuestNarration,
  instantNarration,
  narrateScan,
  generateNarration,
  inferTone,
};
