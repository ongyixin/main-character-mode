/**
 * Escalation Engine
 * Detects dramatic threshold crossings and generates escalation events.
 * These are narrative bombs: jealousy spikes, heartbreaks, alliance reveals.
 */

import { v4 as uuid } from "uuid";
import type {
  StoryModeState,
  EscalationEvent,
  ObjectCharacter,
  RelationshipEdge,
} from "@/types";

// ─── Threshold constants ───────────────────────────────────────────────────────

const THRESHOLDS = {
  heartbreak: { drop: -30, wasAbove: 30 },     // score fell to below -30 from above 30
  devotion: { above: 75 },                       // score crossed above 75
  jealousy: { rivalAbove: 60, triggerAt: 3 },   // 3 consecutive interactions with another character while rival is >60
  alliance: { bothAbove: 50 },                   // two characters both above 50
  rivalryReveal: { edge: "rivalry" as const, bothInteracted: true },
} as const;

// ─── Escalation check ─────────────────────────────────────────────────────────

export interface EscalationCheckContext {
  /** The character that was just interacted with */
  interactedCharacterId: string;
  /** Their relationship score BEFORE this interaction */
  previousScore: number;
  /** Their relationship score AFTER this interaction */
  newScore: number;
  /** How many total interactions have occurred this session */
  totalInteractions: number;
}

/**
 * Check for escalation after an interaction.
 * Returns an EscalationEvent if a threshold is crossed, otherwise null.
 * Only one escalation fires per check (highest priority wins).
 */
export function checkEscalation(
  state: StoryModeState,
  ctx: EscalationCheckContext
): EscalationEvent | null {
  const { interactedCharacterId, previousScore, newScore, totalInteractions } = ctx;
  const interacted = state.characters.find((c) => c.id === interactedCharacterId);
  if (!interacted) return null;

  // Don't fire during the first 2 interactions — let the scene breathe
  if (totalInteractions < 3) return null;

  // ── 1. HEARTBREAK ARC ────────────────────────────────────────────────────
  // Character score dropped sharply into hostile territory
  if (previousScore >= THRESHOLDS.heartbreak.wasAbove && newScore < THRESHOLDS.heartbreak.drop) {
    return buildEvent(
      "heartbreak",
      [interactedCharacterId],
      `${interacted.name} — ${interacted.personality} — has been pushed past the point of no return.`,
      `${interacted.name} has gone quiet in a way that is somehow louder than anything they've ever said.`,
      `The ${interacted.objectLabel} has entered its heartbreak arc. This was not handled well.`
    );
  }

  // ── 2. JEALOUSY SPIKE ────────────────────────────────────────────────────
  // A non-interacted character has >60 score and we just talked to someone else
  const jealousRival = findJealousRival(state, interactedCharacterId);
  if (jealousRival && jealousRival.relationshipToUser >= THRESHOLDS.jealousy.rivalAbove) {
    return buildEvent(
      "argument",
      [interactedCharacterId, jealousRival.id],
      `${jealousRival.name} watched you pay attention to ${interacted.name}. ${jealousRival.name} is not fine.`,
      `${jealousRival.name}'s emotional state has changed. They are not fine. They want you to know this.`,
      `Jealousy spike detected: ${jealousRival.name} (${jealousRival.objectLabel}) is spiraling.`
    );
  }

  // ── 3. ALLIANCE REVEALED ─────────────────────────────────────────────────
  // Two characters both cross 50 relationship score
  const alliancePair = findAlliancePair(state);
  if (alliancePair) {
    const [a, b] = alliancePair;
    return buildEvent(
      "alliance_formed",
      [a.id, b.id],
      `${a.name} and ${b.name} have been quietly forming an alliance. You made this happen.`,
      `${a.name} and ${b.name} exchange a look. You realize something has been decided without you.`,
      `Alliance detected: ${a.name} + ${b.name}. The room has factions now.`
    );
  }

  // ── 4. DEVOTION REVEAL ───────────────────────────────────────────────────
  // A character's score crosses above 75 for the first time
  if (newScore >= THRESHOLDS.devotion.above && previousScore < THRESHOLDS.devotion.above) {
    const rivalEdge = state.relationships.find(
      (e) =>
        (e.fromId === interactedCharacterId || e.toId === interactedCharacterId) &&
        e.type === "rivalry"
    );
    if (rivalEdge) {
      const rivalId = rivalEdge.fromId === interactedCharacterId ? rivalEdge.toId : rivalEdge.fromId;
      const rival = state.characters.find((c) => c.id === rivalId);
      if (rival) {
        return buildEvent(
          "revelation",
          [interactedCharacterId, rivalId],
          `${interacted.name}'s devotion to you has not gone unnoticed by ${rival.name}.`,
          `${rival.name} watches ${interacted.name} watch you. The rivalry just got personal.`,
          `Revelation: ${interacted.name}'s allegiance to you has created a new enemy.`
        );
      }
    }
  }

  // ── 5. DEMO SAFETY ESCALATION ────────────────────────────────────────────
  // After 6+ interactions with no escalation, trigger a mild argument to keep the demo alive
  if (totalInteractions >= 6 && state.characters.length >= 2) {
    const mostNeglected = state.characters
      .filter((c) => c.id !== interactedCharacterId)
      .sort((a, b) => a.relationshipToUser - b.relationshipToUser)[0];
    if (mostNeglected && mostNeglected.emotionalState !== "jealous") {
      return buildEvent(
        "argument",
        [interactedCharacterId, mostNeglected.id],
        `${mostNeglected.name} has been waiting. The waiting has become a problem.`,
        `${mostNeglected.name} clears their throat, metaphorically. Then again, not so metaphorically.`,
        `Tension spike: ${mostNeglected.name} has had enough of being ignored.`
      );
    }
  }

  return null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildEvent(
  type: EscalationEvent["type"],
  characterIds: string[],
  description: string,
  narrativeText: string,
  title: string
): EscalationEvent {
  return {
    id: uuid(),
    type,
    title,
    description,
    affectedCharacterIds: characterIds,
    narrativeText,
    timestamp: Date.now(),
  };
}

/**
 * Find a character that would be jealous of the one being interacted with.
 * Must have either a rivalry edge or high relationship score and not be the current character.
 */
function findJealousRival(
  state: StoryModeState,
  currentCharacterId: string
): ObjectCharacter | null {
  const rivals = state.characters.filter((c) => {
    if (c.id === currentCharacterId) return false;
    if (c.relationshipToUser < 60) return false;
    // Check for a crush or rivalry edge
    const edge = state.relationships.find(
      (e) =>
        (e.fromId === c.id || e.toId === c.id) &&
        (e.type === "crush" || e.type === "rivalry")
    );
    return !!edge || c.emotionalState.includes("jealous") || c.personality.includes("jealous");
  });
  return rivals[0] ?? null;
}

/**
 * Find a pair of characters that have both crossed the alliance threshold.
 */
function findAlliancePair(
  state: StoryModeState
): [ObjectCharacter, ObjectCharacter] | null {
  const qualifiers = state.characters.filter(
    (c) => c.relationshipToUser >= THRESHOLDS.alliance.bothAbove
  );
  if (qualifiers.length < 2) return null;

  // Check if there's an alliance edge between any two of them
  for (let i = 0; i < qualifiers.length; i++) {
    for (let j = i + 1; j < qualifiers.length; j++) {
      const a = qualifiers[i];
      const b = qualifiers[j];
      const edge = state.relationships.find(
        (e) =>
          (e.fromId === a.id && e.toId === b.id) ||
          (e.fromId === b.id && e.toId === a.id)
      );
      if (edge && (edge.type === "alliance" || edge.type === "crush")) {
        return [a, b];
      }
    }
  }
  // No alliance edge but both are high — the alliance has formed organically
  return [qualifiers[0], qualifiers[1]];
}

// ─── Escalation narration helpers ─────────────────────────────────────────────

/** Get a dramatic banner title for an escalation type */
export function escalationBannerTitle(type: EscalationEvent["type"]): string {
  const titles: Record<EscalationEvent["type"], string> = {
    heartbreak: "💔 HEARTBREAK ARC TRIGGERED",
    argument: "⚡ JEALOUSY SPIKE DETECTED",
    alliance_formed: "🤝 ALLIANCE REVEALED",
    boss_sequence: "👹 BOSS SEQUENCE INITIATED",
    revelation: "🔮 REVELATION",
  };
  return titles[type];
}

/** Map escalation type to a music mood suggestion */
export function escalationMusicMood(
  type: EscalationEvent["type"]
): "tragic" | "chaotic" | "suspenseful" {
  if (type === "heartbreak") return "tragic";
  if (type === "boss_sequence") return "chaotic";
  return "suspenseful";
}
