/**
 * Object personification engine — Story Mode.
 * Converts a detected object into a full character via Gemini.
 * This stub is owned by the Shared Engine agent; the Story Mode agent
 * should extend the prompts and logic here for richer characters.
 */

import { v4 as uuidv4 } from "uuid";
import { safeGenerateJSON } from "@/lib/shared/gemini";
import { personificationPrompt } from "@/lib/shared/prompts";
import type {
  DetectedObject,
  ObjectCharacter,
  StoryGenre,
  IPersonification,
} from "@/types";

// ─── Deterministic fallback characters ───────────────────────────────────────
// Used when Gemini is unavailable. Keyed by object label keywords.

const FALLBACK_ARCHETYPES: Array<{
  match: RegExp;
  name: string;
  personality: string;
  voiceStyle: string;
  emotionalState: string;
  relationshipStance: string;
}> = [
  {
    match: /lamp|light/i,
    name: "Lumina",
    personality: "jealous poet",
    voiceStyle: "theatrical whisper",
    emotionalState: "brooding",
    relationshipStance: "secretly in love but will never admit it",
  },
  {
    match: /mug|cup|coffee/i,
    name: "Gordo",
    personality: "weary philosopher",
    voiceStyle: "dry and resigned",
    emotionalState: "resigned",
    relationshipStance: "loyal but exhausted",
  },
  {
    match: /book|stack/i,
    name: "The Stack",
    personality: "unstable collective",
    voiceStyle: "conspiratorial hiss",
    emotionalState: "excitable",
    relationshipStance: "suspicious but curious",
  },
  {
    match: /chair|sofa|couch/i,
    name: "Chester",
    personality: "passive-aggressive enabler",
    voiceStyle: "aggressively supportive",
    emotionalState: "smug",
    relationshipStance: "deceptively helpful",
  },
  {
    match: /plant|flower/i,
    name: "Verdana",
    personality: "quiet nihilist",
    voiceStyle: "serene and unsettling",
    emotionalState: "detached",
    relationshipStance: "observing judgment",
  },
  {
    match: /door|window/i,
    name: "Portia",
    personality: "boundary-obsessed gatekeeper",
    voiceStyle: "formal and clipped",
    emotionalState: "territorial",
    relationshipStance: "gatekeeping everything",
  },
];

function fallbackCharacter(object: DetectedObject): ObjectCharacter {
  const archetype =
    FALLBACK_ARCHETYPES.find((a) => a.match.test(object.label)) ??
    FALLBACK_ARCHETYPES[0];

  return {
    id: object.id,
    objectLabel: object.label,
    name: archetype.name,
    personality: archetype.personality,
    voiceStyle: archetype.voiceStyle,
    emotionalState: archetype.emotionalState,
    relationshipToUser: 0,
    relationshipStance: archetype.relationshipStance,
    memories: [],
  };
}

// ─── Implementation ───────────────────────────────────────────────────────────

/**
 * Bulk personification — process all new objects and return characters.
 * Called by storyEngine.ts processScan.
 */
export async function personifyObjects(
  objects: DetectedObject[],
  genre: StoryGenre,
  existingCharacters: ObjectCharacter[]
): Promise<ObjectCharacter[]> {
  const results = await Promise.all(
    objects.map((obj) => personification.personify(obj, genre, existingCharacters))
  );
  return results;
}

/**
 * Returns deterministic fallback characters for demo mode / API unavailable.
 * Used by story/page.tsx when Gemini is unreachable.
 */
export function demoFallbackCharacters(
  objects: DetectedObject[]
): ObjectCharacter[] {
  return objects.map((obj) => fallbackCharacter(obj));
}

export const personification: IPersonification = {
  async personify(
    object: DetectedObject,
    genre: StoryGenre,
    existingCharacters: ObjectCharacter[]
  ): Promise<ObjectCharacter> {
    const existingNames = existingCharacters.map((c) => c.name);
    const prompt = personificationPrompt(
      object.label,
      object.context,
      genre,
      existingNames
    );

    interface PersonifyResult {
      name: string;
      personality: string;
      voiceStyle: string;
      emotionalState: string;
      relationshipToUser: number;
      relationshipStance: string;
    }

    const result = await safeGenerateJSON<PersonifyResult>(prompt);

    if (!result) return fallbackCharacter(object);

    return {
      id: object.id || uuidv4(),
      objectLabel: object.label,
      name: result.name,
      personality: result.personality,
      voiceStyle: result.voiceStyle,
      emotionalState: result.emotionalState,
      relationshipToUser: result.relationshipToUser ?? 0,
      relationshipStance: result.relationshipStance,
      memories: [],
    };
  },
};
