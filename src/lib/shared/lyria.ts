// Lyria adaptive soundtrack wrapper.
// Uses REST API when available; falls back to a curated set of static mood tracks.
// Callers should never break if Lyria is unavailable.

import type {
  LyriaControlSignal,
  LyriaTrack,
  MusicMood,
  IMusicController,
  FallbackTrackMap,
  ActiveMode,
} from "@/types";

const LYRIA_API_URL = process.env.LYRIA_API_URL ?? "";
const LYRIA_API_KEY = process.env.LYRIA_API_KEY ?? "";

// Fallback tracks: these should be short loopable MP3/OGG files in /public/audio/
// Replace URLs with real assets at integration time.
const FALLBACK_TRACKS: FallbackTrackMap = {
  neutral: "/audio/fallback/neutral.mp3",
  romantic: "/audio/fallback/romantic.mp3",
  suspenseful: "/audio/fallback/suspenseful.mp3",
  chaotic: "/audio/fallback/chaotic.mp3",
  tragic: "/audio/fallback/tragic.mp3",
  comedic: "/audio/fallback/comedic.mp3",
  focused: "/audio/fallback/focused.mp3",
  driving: "/audio/fallback/driving.mp3",
  triumphant: "/audio/fallback/triumphant.mp3",
  urgent: "/audio/fallback/urgent.mp3",
  ambient: "/audio/fallback/ambient.mp3",
  idle: "/audio/fallback/ambient.mp3",
  // Legacy aliases → reuse similar canonical tracks
  "tension-rising": "/audio/fallback/suspenseful.mp3",
  victory:          "/audio/fallback/triumphant.mp3",
  action:           "/audio/fallback/driving.mp3",
  dialogue:         "/audio/fallback/romantic.mp3",
  "ambient-explore": "/audio/fallback/ambient.mp3",
};

/** Human-readable metadata for each mood — used in MusicIndicator UI */
export const TRACK_METADATA: Record<MusicMood, { label: string; bpm: number; description: string; colorHex: string; emoji: string }> = {
  neutral:          { label: "Neutral",     bpm: 75,  description: "Quiet between-scenes texture",       colorHex: "#888899", emoji: "🌫️" },
  ambient:          { label: "Ambient",     bpm: 70,  description: "Quiet background atmosphere",         colorHex: "#8890aa", emoji: "✨" },
  romantic:         { label: "Romantic",    bpm: 82,  description: "Soft strings and piano",              colorHex: "#f472b6", emoji: "🌹" },
  suspenseful:      { label: "Suspenseful", bpm: 95,  description: "Low drones and building tension",     colorHex: "#a78bfa", emoji: "🕯️" },
  chaotic:          { label: "Chaotic",     bpm: 140, description: "Dissonant brass and percussion",      colorHex: "#f87171", emoji: "⚡" },
  tragic:           { label: "Tragic",      bpm: 60,  description: "Mournful cello and silence",          colorHex: "#60a5fa", emoji: "🎻" },
  comedic:          { label: "Comedic",     bpm: 110, description: "Bouncy woodwinds and cartoon stabs",  colorHex: "#fbbf24", emoji: "🎭" },
  focused:          { label: "Focused",     bpm: 90,  description: "Minimal lo-fi beats",                 colorHex: "#34d399", emoji: "🎯" },
  driving:          { label: "Driving",     bpm: 128, description: "Punchy electronic rhythm",            colorHex: "#22d3ee", emoji: "🔥" },
  triumphant:       { label: "Triumphant",  bpm: 115, description: "Full brass and percussion swell",     colorHex: "#fcd34d", emoji: "🏆" },
  urgent:           { label: "Urgent",      bpm: 140, description: "Staccato strings and rapid pulse",    colorHex: "#ef4444", emoji: "🚨" },
  idle:             { label: "Idle",        bpm: 60,  description: "Sparse ambient, waiting texture",     colorHex: "#6b7280", emoji: "💤" },
  // Legacy aliases — map visually to similar canonical moods
  "tension-rising": { label: "Tension",     bpm: 110, description: "Escalating tension",                  colorHex: "#a78bfa", emoji: "🕯️" },
  victory:          { label: "Victory",     bpm: 115, description: "Mission complete",                    colorHex: "#fcd34d", emoji: "🏆" },
  action:           { label: "Action",      bpm: 130, description: "High momentum",                       colorHex: "#22d3ee", emoji: "🔥" },
  dialogue:         { label: "Dialogue",    bpm: 80,  description: "Character interaction",               colorHex: "#f0d898", emoji: "💬" },
  "ambient-explore":{ label: "Exploring",  bpm: 75,  description: "Open world ambience",                  colorHex: "#8890aa", emoji: "🗺️" },
};

// Map story phase → music mood
const STORY_PHASE_TO_MOOD: Record<string, MusicMood> = {
  scanning:     "neutral",
  exploring:    "suspenseful",
  quest_active: "focused",
  escalation:   "chaotic",
  climax:       "chaotic",
  recap:        "comedic",
};

/**
 * Derives mood + intensity from current session context.
 * Called by /api/music before requesting a track.
 */
export function deriveMusicState(
  activeMode: ActiveMode,
  storyPhase?: string,
  combo?: number,
  productivityScore?: number,
  sceneMood?: string
): { mood: MusicMood; intensity: number; trackLabel: string } {
  let mood: MusicMood = "ambient";
  let intensity = 0.4;

  if (activeMode === "story") {
    mood = (storyPhase ? STORY_PHASE_TO_MOOD[storyPhase] : undefined) ?? "ambient";
    intensity = storyPhase === "escalation" || storyPhase === "climax" ? 0.85 : 0.5;
  } else {
    // Quest mode: driven by momentum
    const score = productivityScore ?? 50;
    const c = combo ?? 0;
    if (c >= 5) {
      mood = "triumphant";
      intensity = 0.9;
    } else if (score > 80) {
      mood = "driving";
      intensity = 0.8;
    } else if (score > 50) {
      mood = "focused";
      intensity = 0.6;
    } else if (score > 20) {
      mood = "ambient";
      intensity = 0.4;
    } else {
      mood = "idle";
      intensity = 0.2;
    }
  }

  // Scene mood can nudge: chaotic/tense scenes bump intensity
  if (sceneMood && (sceneMood.includes("chaotic") || sceneMood.includes("tense"))) {
    intensity = Math.min(1, intensity + 0.15);
  }

  const trackLabel = TRACK_METADATA[mood]?.label ?? mood;
  return { mood, intensity, trackLabel };
}

/**
 * Convenience wrapper: derive a track for a given mood + intensity.
 * Returns { trackUrl, trackLabel } — trackUrl may be null (fallback visual-only state).
 */
export async function requestTrack(signal: {
  mood: MusicMood;
  intensity: number;
  activeMode: ActiveMode;
}): Promise<{ trackUrl: string | null; trackLabel: string }> {
  const tempo = signal.intensity > 0.7 ? "fast" : signal.intensity > 0.4 ? "medium" : "slow";

  const track = await musicController.getTrack({
    mood: signal.mood,
    tempo,
    intensity: signal.intensity,
    environment: "unknown",
    activeMode: signal.activeMode,
  });

  return {
    trackUrl: track.url || null,
    trackLabel: TRACK_METADATA[signal.mood]?.label ?? signal.mood,
  };
}

// Cache to avoid re-requesting the same mood
const trackCache = new Map<string, LyriaTrack>();

function cacheKey(signal: LyriaControlSignal): string {
  return `${signal.mood}:${signal.tempo}:${Math.round(signal.intensity * 10)}`;
}

export const musicController: IMusicController = {
  async getTrack(signal: LyriaControlSignal): Promise<LyriaTrack> {
    const key = cacheKey(signal);
    if (trackCache.has(key)) return trackCache.get(key)!;

    // Attempt live Lyria API
    if (LYRIA_API_URL && LYRIA_API_KEY) {
      try {
        const response = await fetch(`${LYRIA_API_URL}/generate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${LYRIA_API_KEY}`,
          },
          body: JSON.stringify({
            mood: signal.mood,
            tempo: signal.tempo,
            intensity: signal.intensity,
            environment: signal.environment,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const track: LyriaTrack = {
            url: data.url,
            mood: signal.mood,
            durationMs: data.durationMs ?? 120000,
          };
          trackCache.set(key, track);
          return track;
        }
      } catch {
        // Fall through to fallback
      }
    }

    // Use static fallback
    const fallbackUrl = FALLBACK_TRACKS[signal.mood] ?? FALLBACK_TRACKS.neutral!;
    const track: LyriaTrack = {
      url: fallbackUrl,
      mood: signal.mood,
      durationMs: 120000,
    };
    return track;
  },

  getFallback(mood: MusicMood): string {
    return FALLBACK_TRACKS[mood] ?? FALLBACK_TRACKS.neutral!;
  },
};
