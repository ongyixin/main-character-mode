/**
 * Relationship management for Story Mode.
 * Tracks inter-character dynamics and user relationship scores.
 * Stub owned by Shared Engine agent; Story Mode agent should extend with
 * richer social dynamics, memory compression, and escalation triggers.
 */

import type {
  StoryModeState,
  ObjectCharacter,
  RelationshipEdge,
  RelationshipType,
  IRelationshipManager,
} from "@/types";

// ─── UI utility functions (used by ObjectLabel and RelationshipBar) ───────────

/** Return a human-readable label for a relationship score */
export function relationshipLabel(score: number): string {
  if (score >= 70) return "devoted";
  if (score >= 40) return "friendly";
  if (score >= 10) return "warming up";
  if (score >= -10) return "neutral";
  if (score >= -40) return "suspicious";
  if (score >= -70) return "hostile";
  return "nemesis";
}

/** Return a Tailwind-compatible color token for a relationship score */
export function relationshipColor(score: number): string {
  if (score >= 50) return "text-emerald-400";
  if (score >= 10) return "text-yellow-400";
  if (score >= -10) return "text-white/60";
  if (score >= -50) return "text-orange-400";
  return "text-red-500";
}

/** Escalation thresholds — exported for storyEngine.ts */
export const THRESHOLD_ESCALATION_HIGH = 80;
export const THRESHOLD_ESCALATION_LOW = -50;

// ─── Inter-object relationship generation ─────────────────────────────────────

const RELATIONSHIP_PAIRS: Array<{
  a: RegExp;
  b: RegExp;
  type: RelationshipType;
  reason: string;
}> = [
  {
    a: /lamp|light/i,
    b: /mug|cup|coffee/i,
    type: "rivalry",
    reason: "The lamp thinks the mug hogs the spotlight",
  },
  {
    a: /chair|sofa/i,
    b: /desk|table/i,
    type: "alliance",
    reason: "Professional proximity has bred a grudging solidarity",
  },
  {
    a: /book|stack/i,
    b: /phone|device/i,
    type: "grudge",
    reason: "A centuries-old rivalry between the written word and the screen",
  },
  {
    a: /plant|flower/i,
    b: /window/i,
    type: "crush",
    reason: "The plant secretly longs for more light",
  },
];

function assignRelationship(
  charA: ObjectCharacter,
  charB: ObjectCharacter
): RelationshipEdge | null {
  for (const pair of RELATIONSHIP_PAIRS) {
    const matchAB =
      pair.a.test(charA.objectLabel) && pair.b.test(charB.objectLabel);
    const matchBA =
      pair.a.test(charB.objectLabel) && pair.b.test(charA.objectLabel);

    if (matchAB || matchBA) {
      return {
        fromId: charA.id,
        toId: charB.id,
        type: pair.type,
        intensity: 0.5 + Math.random() * 0.4, // 0.5–0.9
        reason: pair.reason,
      };
    }
  }

  // Default: mild indifference between objects not in the pattern list
  if (Math.random() < 0.3) {
    return {
      fromId: charA.id,
      toId: charB.id,
      type: "indifferent",
      intensity: 0.1,
      reason: "They've never had reason to care",
    };
  }

  return null;
}

// ─── Implementation ───────────────────────────────────────────────────────────

export const relationshipManager: IRelationshipManager = {
  updateRelationship(
    state: StoryModeState,
    characterId: string,
    delta: number,
    _interactionContext: string
  ): StoryModeState {
    const characters = state.characters.map((c) => {
      if (c.id !== characterId) return c;
      const newScore = Math.max(-100, Math.min(100, c.relationshipToUser + delta));
      return { ...c, relationshipToUser: newScore };
    });

    return { ...state, characters };
  },

  generateInterObjectRelationships(
    characters: ObjectCharacter[]
  ): RelationshipEdge[] {
    const edges: RelationshipEdge[] = [];

    for (let i = 0; i < characters.length; i++) {
      for (let j = i + 1; j < characters.length; j++) {
        const edge = assignRelationship(characters[i], characters[j]);
        if (edge) edges.push(edge);
      }
    }

    return edges;
  },
};

// ─── Standalone function exports (used by storyEngine.ts) ────────────────────

/**
 * Apply a relationship delta to a single character. Pure function.
 */
export function applyRelationshipDelta(
  state: StoryModeState,
  characterId: string,
  delta: number,
  _interactionContext: string
): StoryModeState {
  return relationshipManager.updateRelationship(state, characterId, delta, _interactionContext);
}

/**
 * Build a compact memory context string from character memories, relationships, and
 * recent conversation log for prompt injection.
 */
export function buildMemoryContext(
  character: ObjectCharacter,
  _allCharacters?: ObjectCharacter[],
  _relationships?: RelationshipEdge[],
  _conversationLog?: unknown[]
): string {
  if (!character.memories.length) return "No prior history.";
  return character.memories.slice(-3).join(" | ");
}

/**
 * Generate relationship edges for a set of characters.
 */
export function generateRelationshipEdges(
  characters: ObjectCharacter[]
): RelationshipEdge[] {
  return relationshipManager.generateInterObjectRelationships(characters);
}
