import type { StoryGenre } from "@/types";

export const STORY_GENRES: {
  value: StoryGenre;
  label: string;
  emoji: string;
  description: string;
}[] = [
  { value: "mystery", label: "Mystery", emoji: "🔍", description: "Every object hides a secret" },
  { value: "fantasy", label: "Fantasy", emoji: "⚔️", description: "Epic quests await in the mundane" },
  { value: "soap_opera", label: "Soap Opera", emoji: "🌹", description: "Everyone has secrets. Everyone is betrayed." },
  { value: "workplace_drama", label: "Workplace Drama", emoji: "💼", description: "Office politics, but your lamp is HR" },
  { value: "dating_sim", label: "Dating Sim", emoji: "💘", description: "Romance your furniture, if you dare" },
  { value: "survival", label: "Survival", emoji: "🪓", description: "Trust no-one. Especially the fridge." },
];

/** XP threshold table per level (index = level-1) */
export const LEVEL_THRESHOLDS = [0, 100, 250, 500, 900, 1400, 2100, 3000, 4200, 6000];

/** Momentum idle threshold before penalty (ms) */
export const MOMENTUM_IDLE_THRESHOLD_MS = 30_000;

/** Z-index layers for overlay stacking */
export const Z = {
  camera: 0,
  sceneLabels: 10,
  hud: 20,
  narration: 30,
  modal: 40,
  toast: 50,
} as const;

export const MOCK_NARRATION_LINES = {
  story: [
    "The lamp has noticed you. It does not look pleased.",
    "Rumor has it the toaster and the microwave haven't spoken in three weeks.",
    "A presence stirs. The coffee mug knows something.",
    "The bookshelf is judging you. It always is.",
  ],
  quest: [
    "Asset acquired. Proceed to next objective.",
    "Threat level: moderate. Recommend maintaining tempo.",
    "Field agent, your momentum is holding. Do not waste it.",
    "Intel confirmed. Mission parameters updated.",
  ],
};
