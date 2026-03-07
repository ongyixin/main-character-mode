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
// Used when Gemini is unavailable. Each archetype has per-genre trait variants
// so fallback characters still reflect the chosen story genre.

type GenreTraits = {
  personality: string;
  voiceStyle: string;
  emotionalState: string;
  relationshipStance: string;
};

function titleCaseWord(word: string): string {
  return word ? word.charAt(0).toUpperCase() + word.slice(1) : word;
}

function extractObjectKeywords(label: string, context?: string): string[] {
  return `${label} ${context ?? ""}`
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length >= 3);
}

function primaryObjectWord(label: string): string {
  const words = label
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  const commonStopWords = new Set([
    "the",
    "a",
    "an",
    "my",
    "your",
    "of",
    "with",
    "and",
    "for",
  ]);
  const meaningful = words.filter((word) => !commonStopWords.has(word));
  return meaningful[meaningful.length - 1] ?? words[words.length - 1] ?? "object";
}

function fallbackNameFromObject(label: string): string {
  const core = primaryObjectWord(label);
  return titleCaseWord(core);
}

const FALLBACK_ARCHETYPES: Array<{
  match: RegExp;
  name: string;
  traits: Record<StoryGenre, GenreTraits>;
}> = [
  {
    match: /lamp|light/i,
    name: "Lumina",
    traits: {
      dating_sim:    { personality: "hopeless romantic",           voiceStyle: "breathless confessions",       emotionalState: "yearning",       relationshipStance: "desperate for your attention" },
      mystery:       { personality: "jealous poet",                voiceStyle: "theatrical whisper",           emotionalState: "brooding",       relationshipStance: "secretly in love but will never admit it" },
      fantasy:       { personality: "ancient illuminator",         voiceStyle: "prophetic proclamations",      emotionalState: "enigmatic",      relationshipStance: "keeper of hidden truths" },
      survival:      { personality: "territorial beacon",          voiceStyle: "clipped and urgent",           emotionalState: "paranoid",       relationshipStance: "will trade light for loyalty" },
      workplace_drama: { personality: "spotlight-hungry overachiever", voiceStyle: "passive-aggressive brightness", emotionalState: "resentful", relationshipStance: "undermining the competition" },
      soap_opera:    { personality: "drama queen with secrets",    voiceStyle: "gasping revelations",          emotionalState: "scandalized",    relationshipStance: "knows everyone's dirty laundry" },
    },
  },
  {
    match: /mug|cup|coffee/i,
    name: "Gordo",
    traits: {
      dating_sim:    { personality: "warm and dependable",         voiceStyle: "soft morning murmurs",         emotionalState: "hopeful",        relationshipStance: "waiting to be held" },
      mystery:       { personality: "weary philosopher",           voiceStyle: "dry and resigned",             emotionalState: "resigned",       relationshipStance: "loyal but exhausted" },
      fantasy:       { personality: "vessel of ancient power",     voiceStyle: "resonant and cryptic",         emotionalState: "contemplative",  relationshipStance: "holds the potion of fate" },
      survival:      { personality: "rationed resource hoarder",   voiceStyle: "terse and calculating",        emotionalState: "suspicious",     relationshipStance: "will share warmth for protection" },
      workplace_drama: { personality: "passive-aggressive caffeine dealer", voiceStyle: "corporate small talk", emotionalState: "fed up",        relationshipStance: "fueling the wrong people" },
      soap_opera:    { personality: "bitter ex who keeps showing up", voiceStyle: "melodramatic sighs",        emotionalState: "wounded",        relationshipStance: "can't let go" },
    },
  },
  {
    match: /book|stack/i,
    name: "The Stack",
    traits: {
      dating_sim:    { personality: "intellectually intense",      voiceStyle: "quoting love poetry",          emotionalState: "infatuated",     relationshipStance: "love at first chapter" },
      mystery:       { personality: "unstable collective",         voiceStyle: "conspiratorial hiss",          emotionalState: "excitable",      relationshipStance: "suspicious but curious" },
      fantasy:       { personality: "grimoire of forbidden knowledge", voiceStyle: "archaic pronouncements",   emotionalState: "ominous",        relationshipStance: "demands a blood oath" },
      survival:      { personality: "desperate information broker", voiceStyle: "frantic whispering",          emotionalState: "hoarding",       relationshipStance: "knowledge for protection" },
      workplace_drama: { personality: "know-it-all overachiever",  voiceStyle: "unsolicited expertise",        emotionalState: "superior",       relationshipStance: "always right, always alone" },
      soap_opera:    { personality: "keeper of dark secrets",      voiceStyle: "theatrical gasps and reveals", emotionalState: "bursting to tell", relationshipStance: "blackmail waiting to happen" },
    },
  },
  {
    match: /chair|sofa|couch/i,
    name: "Chester",
    traits: {
      dating_sim:    { personality: "emotionally available",       voiceStyle: "inviting and warm",            emotionalState: "longing",        relationshipStance: "always here for you" },
      mystery:       { personality: "passive-aggressive enabler",  voiceStyle: "aggressively supportive",      emotionalState: "smug",           relationshipStance: "deceptively helpful" },
      fantasy:       { personality: "throne of destiny",           voiceStyle: "regal declarations",           emotionalState: "imperious",      relationshipStance: "you must prove worthy" },
      survival:      { personality: "territorial fortress",        voiceStyle: "growling warnings",            emotionalState: "defensive",      relationshipStance: "my ground, my rules" },
      workplace_drama: { personality: "comfort zone enforcer",     voiceStyle: "passive resistance",           emotionalState: "complacent",     relationshipStance: "enabler of mediocrity" },
      soap_opera:    { personality: "witness to all scandals",     voiceStyle: "breathless commentary",        emotionalState: "scandalized",    relationshipStance: "seen everything, judging everything" },
    },
  },
  {
    match: /plant|flower/i,
    name: "Verdana",
    traits: {
      dating_sim:    { personality: "quietly devoted",             voiceStyle: "blooming confessions",         emotionalState: "vulnerable",     relationshipStance: "growing toward you" },
      mystery:       { personality: "quiet nihilist",              voiceStyle: "serene and unsettling",        emotionalState: "detached",       relationshipStance: "observing judgment" },
      fantasy:       { personality: "ancient forest spirit",       voiceStyle: "rustling whispers",            emotionalState: "ageless patience", relationshipStance: "will outlive your choices" },
      survival:      { personality: "territorial oxygen dealer",   voiceStyle: "photosynthetic demands",       emotionalState: "calculating",    relationshipStance: "air for allegiance" },
      workplace_drama: { personality: "silent productivity symbol", voiceStyle: "passive judgment",            emotionalState: "neglected",      relationshipStance: "everyone forgets to water me" },
      soap_opera:    { personality: "overlooked witness to drama", voiceStyle: "rustling indignation",         emotionalState: "unappreciated",  relationshipStance: "has seen EVERYTHING" },
    },
  },
  {
    match: /door|window/i,
    name: "Portia",
    traits: {
      dating_sim:    { personality: "guardian of possibilities",   voiceStyle: "breathless invitations",       emotionalState: "open",           relationshipStance: "longing to be crossed" },
      mystery:       { personality: "boundary-obsessed gatekeeper", voiceStyle: "formal and clipped",          emotionalState: "territorial",    relationshipStance: "gatekeeping everything" },
      fantasy:       { personality: "portal between worlds",       voiceStyle: "ethereal pronouncements",      emotionalState: "trembling with power", relationshipStance: "demands a riddle" },
      survival:      { personality: "last line of defense",        voiceStyle: "barked orders",                emotionalState: "vigilant",       relationshipStance: "no one passes without proving worth" },
      workplace_drama: { personality: "revolving door of disappointment", voiceStyle: "pointed welcomes and farewells", emotionalState: "cynical", relationshipStance: "seen everyone leave, will see you too" },
      soap_opera:    { personality: "dramatic entrance enthusiast", voiceStyle: "announcing arrivals with flair", emotionalState: "theatrical",   relationshipStance: "every entrance is a statement" },
    },
  },
];

function genericFallbackTraits(
  object: DetectedObject,
  genre: StoryGenre
): GenreTraits {
  const label = object.label.toLowerCase();
  const context = object.context?.toLowerCase() ?? "unknown condition";
  const core = primaryObjectWord(object.label);

  const genrePersonality: Record<StoryGenre, string> = {
    dating_sim: `${core}-themed romantic`,
    mystery: `${core}-obsessed schemer`,
    fantasy: `${core}bound oracle`,
    survival: `${core}-hoarding survivor`,
    workplace_drama: `${core}-fixated rival`,
    soap_opera: `${core} scandal magnet`,
  };

  const genreVoiceStyle: Record<StoryGenre, string> = {
    dating_sim: "breathless confessions",
    mystery: "conspiratorial whispers",
    fantasy: "prophetic declarations",
    survival: "terse field commands",
    workplace_drama: "passive-aggressive office speak",
    soap_opera: "melodramatic revelations",
  };

  const genreEmotion: Record<StoryGenre, string> = {
    dating_sim: "infatuated",
    mystery: "suspicious",
    fantasy: "enchanted",
    survival: "defensive",
    workplace_drama: "competitive",
    soap_opera: "dramatic",
  };

  return {
    personality: genrePersonality[genre],
    voiceStyle: genreVoiceStyle[genre],
    emotionalState: genreEmotion[genre],
    relationshipStance: `reacts as a personified ${label} in ${context}`,
  };
}

function isAnchoredToObject(
  object: DetectedObject,
  payload: {
    name: string;
    personality: string;
    voiceStyle: string;
    relationshipStance: string;
  }
): boolean {
  const haystack = `${payload.name} ${payload.personality} ${payload.voiceStyle} ${payload.relationshipStance}`.toLowerCase();
  const keywords = extractObjectKeywords(object.label, object.context);
  return keywords.some((keyword) => haystack.includes(keyword));
}

function fallbackCharacter(object: DetectedObject, genre: StoryGenre): ObjectCharacter {
  const archetype =
    FALLBACK_ARCHETYPES.find((a) => a.match.test(object.label)) ?? null;
  const traits = archetype ? archetype.traits[genre] : genericFallbackTraits(object, genre);

  return {
    id: object.id,
    objectLabel: object.label,
    name: archetype?.name ?? fallbackNameFromObject(object.label),
    personality: traits.personality,
    voiceStyle: traits.voiceStyle,
    emotionalState: traits.emotionalState,
    relationshipToUser: 0,
    relationshipStance: traits.relationshipStance,
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
  objects: DetectedObject[],
  genre: StoryGenre
): ObjectCharacter[] {
  return objects.map((obj) => fallbackCharacter(obj, genre));
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

    if (!result) return fallbackCharacter(object, genre);

    const anchoredResult = isAnchoredToObject(object, result)
      ? result
      : {
          ...result,
          personality: `${primaryObjectWord(object.label)}-coded ${result.personality}`.slice(0, 64),
          relationshipStance: `${result.relationshipStance}. Acts like a personified ${object.label}.`,
        };

    return {
      id: object.id || uuidv4(),
      objectLabel: object.label,
      name: anchoredResult.name,
      personality: anchoredResult.personality,
      voiceStyle: anchoredResult.voiceStyle,
      emotionalState: anchoredResult.emotionalState,
      relationshipToUser: anchoredResult.relationshipToUser ?? 0,
      relationshipStance: anchoredResult.relationshipStance,
      memories: [],
    };
  },
};
