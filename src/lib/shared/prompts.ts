// All AI prompt templates in one place.
// This is the creative core of the app — quality here directly determines demo quality.
// Keep prompts in this file so they can be tuned independently of business logic.

import type { ActiveMode, StoryGenre, InteractionMode, MissionCategory } from "@/types";

// ---------------------------------------------------------------------------
// Scene analysis prompts
// ---------------------------------------------------------------------------

export function sceneAnalysisPrompt(mode: ActiveMode, genre?: StoryGenre): string {
  if (mode === "story") {
    const genreMoodHints: Record<StoryGenre, string> = {
      dating_sim:       "romantic, intimate, longing — highlight objects with emotional or symbolic resonance",
      mystery:          "tense, suspicious, shadowy — highlight objects that could hide secrets or clues",
      fantasy:          "magical, ancient, epic — highlight objects with otherworldly or symbolic potential",
      survival:         "threatening, resource-scarce, territorial — highlight objects with utility or danger",
      workplace_drama:  "competitive, stressful, performative — highlight objects that signal status or ambition",
      soap_opera:       "dramatic, excessive, scandalous — highlight objects involved in conflict or secrets",
    };
    const moodInstruction = genre
      ? `Interpret the mood through a ${genre.replace("_", " ")} lens: ${genreMoodHints[genre]}.`
      : "Describe the mood neutrally.";

    return `Analyze this camera frame and return a JSON object with this exact shape:
{
  "sceneType": string,       // e.g. "bedroom", "kitchen", "office", "living room"
  "objects": [
    {
      "id": string,          // slug e.g. "lamp_1", "book_1", "phone_1"
      "label": string,       // e.g. "floor lamp", "paperback book", "coffee mug"
      "salience": number,    // 0.0–1.0, how visually prominent or intentionally presented
      "position": "left" | "center" | "right" | "background",
      "context": string      // brief description of state/appearance, colored by the genre mood
    }
  ],
  "mood": string,            // e.g. "cozy", "chaotic", "tense", "melancholic"
  "spatialContext": string   // one sentence describing the scene arrangement
}

PRIORITY ORDER for object selection:
1. Any object that appears to be deliberately held up, presented, or placed in the foreground — these are the MOST important even if small (phone, book, mug, toy, bottle, remote, etc.)
2. Objects occupying the center of frame or closest to the camera
3. Background furniture and large decor as context

Identify ALL visible objects — small and large, held items, everyday objects, anything recognizable.
Do NOT restrict to only furniture or appliances.
Include up to 5 objects max. Order by salience (highest first), where intentionally-presented foreground objects score highest.
Be specific about condition and appearance.
${moodInstruction}`;
  }

  return `Analyze this camera frame and return a JSON object with this exact shape:
{
  "sceneType": string,       // e.g. "kitchen", "grocery store", "desk", "gym"
  "objects": [
    {
      "id": string,
      "label": string,
      "salience": number,
      "position": "left" | "center" | "right" | "background",
      "context": string
    }
  ],
  "mood": string,
  "spatialContext": string   // describe what activity this environment suggests
}

Identify ALL visible objects — foreground items, held items, and environmental context.
Prioritize objects being actively held or presented to camera (highest salience).
Include up to 6 objects max, ordered by salience.
Focus on what task or mission context the scene and objects suggest.
Which real-world tasks or missions would naturally happen here?`;
}

// ---------------------------------------------------------------------------
// Story Mode prompts
// ---------------------------------------------------------------------------

export function personificationPrompt(
  objectLabel: string,
  objectContext: string,
  genre: StoryGenre,
  existingCharacterNames: string[]
): string {
  const genreGuides: Record<StoryGenre, string> = {
    dating_sim: "romantic tension, longing, jealousy, emotional vulnerability",
    mystery: "secrets, suspicion, cryptic knowledge, hidden agendas",
    fantasy: "ancient power, magical grudges, elemental alignments, prophecies",
    survival: "desperation, territorial, resource hoarding, unlikely alliances",
    workplace_drama: "professional jealousy, ambition, passive aggression, office politics",
    soap_opera: "betrayal, secret relationships, dramatic reveals, overblown emotions",
  };

  return `You are creating a character for a ${genre.replace("_", " ")} game.

Object: "${objectLabel}" (${objectContext})
Genre tone: ${genreGuides[genre]}
Already existing characters (avoid duplicating names): ${existingCharacterNames.join(", ") || "none yet"}

Create a character that:
1. Derives personality from the object's real-world function and appearance
2. Fits the genre tone perfectly
3. Has strong comedic or dramatic potential
4. Is memorable in one sentence

Hard constraints:
- The character MUST be a personification of THIS exact object ("${objectLabel}"), not a random archetype.
- Encode object-specific traits in output (material, function, or wear/condition from context).
- If object is "jacket", character should clearly feel jacket-like (protective, layered, wearable, zipper/button motifs), not generic.
- Keep the character grounded in the detected object label and context.

Return JSON with this exact shape:
{
  "name": string,              // single distinctive name
  "personality": string,       // 2-4 word archetype e.g. "jealous poet", "passive-aggressive oracle"
  "voiceStyle": string,        // how they speak e.g. "dramatic whisper", "corporate doublespeak"
  "emotionalState": string,    // current feeling e.g. "brooding", "desperate", "smug"
  "relationshipToUser": 0,     // always start at 0
  "relationshipStance": string // their initial attitude e.g. "cautiously interested", "suspicious"
}`;
}

export function dialoguePrompt(
  characterName: string,
  personality: string,
  voiceStyle: string,
  emotionalState: string,
  relationshipToUser: number,
  memories: string[],
  interactionMode: InteractionMode,
  userMessage: string,
  nearbyCharacters: string,
  genre: StoryGenre
): string {
  const modeInstructions: Record<InteractionMode, string> = {
    flirt: "The user is flirting. React with appropriate genre-specific romantic tension.",
    interrogate: "The user is pressing for information. Reveal something, but not everything.",
    recruit: "The user wants your help. Consider whether your interests align.",
    befriend: "The user wants to be friends. Warm up slightly but maintain personality.",
    roast: "The user is mocking you. Fight back with wit appropriate to your personality.",
    apologize: "The user is apologizing. Decide how graciously to accept based on history.",
    negotiate: "The user wants to make a deal. Negotiate based on your current needs and personality.",
    ignore: "The user is deliberately ignoring you. React according to your personality — outrage, indifference, or scheming.",
  };

  const relationshipDesc =
    relationshipToUser > 60
      ? "strongly positive — they trust you"
      : relationshipToUser > 20
      ? "warming up"
      : relationshipToUser > -20
      ? "neutral"
      : relationshipToUser > -60
      ? "guarded and suspicious"
      : "hostile — this relationship is damaged";

  return `You are ${characterName}, a ${personality} in a ${genre.replace("_", " ")} game. 
Voice style: ${voiceStyle}
Current emotional state: ${emotionalState}
Relationship with user (${relationshipToUser}/100): ${relationshipDesc}
Nearby characters: ${nearbyCharacters || "none"}
Your memories: ${memories.length > 0 ? memories.join(" | ") : "no history yet"}

Interaction mode: ${interactionMode.toUpperCase()}
${modeInstructions[interactionMode]}

User says: "${userMessage}"

Respond in character. Keep it under 4 sentences. Be specific, weird, and memorable.
End with a number from -30 to +30 indicating how much this interaction changed your feelings toward the user.

Return JSON:
{
  "response": string,
  "emotionalStateUpdate": string,   // your new emotional state after this exchange
  "relationshipDelta": number,       // -30 to +30
  "hintAtMemory": string | null,     // something to remember from this exchange, or null
  "triggerQuest": boolean,           // true if this interaction naturally leads to a quest
  "triggerEscalation": boolean       // true if relationship threshold crossed or drama peaked
}`;
}

export function questGenerationPrompt(
  characterName: string,
  personality: string,
  emotionalState: string,
  genre: StoryGenre,
  existingQuestTitles: string[]
): string {
  return `You are ${characterName} (${personality}) in a ${genre.replace("_", " ")} game.
Current emotional state: ${emotionalState}
Existing quests (avoid duplicating): ${existingQuestTitles.join(", ") || "none"}

Issue a quest that:
1. Fits your personality and emotional state
2. Involves other objects/characters in the room
3. Has dramatic or comedic potential
4. Is physically achievable in a real room

Return JSON:
{
  "title": string,
  "description": string,        // 1-2 sentences, in character
  "type": "fetch" | "social" | "choice" | "challenge" | "survival",
  "xpReward": number            // 50–200 based on difficulty
}`;
}

// ---------------------------------------------------------------------------
// Quest Mode prompts
// ---------------------------------------------------------------------------

export function missionFramingPrompt(
  taskText: string,
  sceneContext: string,
  timeOfDay: string,
  recentMissions: string[]
): string {
  return `You are a mission control AI converting mundane tasks into cinematic military/spy missions.
Tone: dry, cinematic, slightly deadpan. NEVER cute or childish.
Good: "Supply run complete. Morale stabilized." Bad: "Yay! You bought milk!"

Task: "${taskText}"
Environment: ${sceneContext}
Time: ${timeOfDay}
Recent missions: ${recentMissions.join(", ") || "none"}

Return JSON:
{
  "codename": string,            // e.g. "Operation: Cleansing Ritual", "Supply Run: Sector 7"
  "briefing": string,            // 2-3 sentences, cinematic tone, second person
  "category": "supply_run" | "restoration" | "containment" | "crafting" | "knowledge_raid" | "recon" | "endurance",
  "objectives": [
    { "id": string, "description": string, "completed": false }
  ],
  "xpReward": number,            // 50–300 based on difficulty
  "contextTrigger": string | null  // scene type that auto-activates this e.g. "grocery store"
}

Keep objectives concrete and specific to the task. Max 4 objectives.`;
}

export function missionNarrationPrompt(
  event: "mission_start" | "objective_complete" | "mission_complete" | "idle" | "combo",
  missionCodename: string,
  combo: number,
  productivityScore: number
): string {
  const eventInstructions = {
    mission_start: `Mission briefing. Dry, authoritative. Acknowledge the mission is now active.`,
    objective_complete: `Objective confirmed. Terse acknowledgment. ${combo > 2 ? `Note the combo of ${combo}. Momentum building.` : ""}`,
    mission_complete: `Mission complete. Brief summary. If productivity is high (${productivityScore}/100), hint at next mission.`,
    idle: `Agent has gone quiet. Dry nudge. Don't be cute about it. "Command has noticed the silence."`,
    combo: `Combo of ${combo} achieved. Acknowledge momentum without being childish.`,
  };

  return `You are mission control AI narrating a real-life productivity game.
Mission: "${missionCodename}"
Event: ${event}
${eventInstructions[event]}

Return JSON:
{
  "text": string,       // narration line, max 20 words
  "tone": "cinematic_briefing" | "field_dispatch" | "mission_control"
}`;
}

// ---------------------------------------------------------------------------
// Shared narration prompts
// ---------------------------------------------------------------------------

export function narratorEventPrompt(
  event: string,
  mode: ActiveMode,
  context: string
): string {
  if (mode === "story") {
    return `You are a dramatic narrator for a story-mode game. The narrator speaks in a documentary-deadpan voice, observing character drama with detached amusement.

Event: ${event}
Context: ${context}

Return JSON:
{
  "text": string,    // narrator line, max 25 words, dry and observational
  "tone": "dramatic" | "documentary" | "deadpan" | "chaotic"
}`;
  }

  return `You are a mission control AI narrator. Dry. Cinematic. Never cute.

Event: ${event}
Context: ${context}

Return JSON:
{
  "text": string,    // narrator line, max 20 words
  "tone": "cinematic_briefing" | "field_dispatch" | "mission_control"
}`;
}

// ---------------------------------------------------------------------------
// Poster / recap prompts
// ---------------------------------------------------------------------------

export function recapPosterPrompt(
  mode: ActiveMode,
  highlights: string[],
  sessionDurationMin: number,
  title: string
): string {
  if (mode === "story") {
    return `Generate a cinematic episode poster prompt for an AI image generator.
Episode title: "${title}"
Session highlights: ${highlights.join(", ")}
Duration: ~${sessionDurationMin} minutes

Create a compelling image generation prompt for a dramatic, slightly absurd game recap poster.
Style: movie poster, slightly surreal, featuring personified objects as characters.

Return JSON:
{
  "imagePrompt": string,   // detailed image generation prompt
  "posterTitle": string,
  "tagline": string
}`;
  }

  return `Generate a cinematic campaign recap poster prompt for an AI image generator.
Campaign highlights: ${highlights.join(", ")}
Session duration: ~${sessionDurationMin} minutes

Style: military campaign briefing poster, cinematic, no cute elements.

Return JSON:
{
  "imagePrompt": string,
  "posterTitle": string,
  "tagline": string
}`;
}

// ---------------------------------------------------------------------------
// Music mood mapping
// ---------------------------------------------------------------------------

export const STORY_PHASE_TO_MOOD: Record<string, string> = {
  scanning: "neutral",
  exploring: "suspenseful",
  quest_active: "focused",
  escalation: "chaotic",
  climax: "dramatic",
  recap: "comedic",
};

export const QUEST_EVENT_TO_MOOD: Record<string, string> = {
  briefed: "ambient",
  active: "focused",
  combo: "driving",
  complete: "triumphant",
  idle: "ambient",
  urgent: "urgent",
};

export const CATEGORY_TO_MOOD: Record<MissionCategory, string> = {
  supply_run: "focused",
  restoration: "ambient",
  containment: "urgent",
  crafting: "focused",
  knowledge_raid: "driving",
  recon: "suspenseful",
  endurance: "driving",
};

// ---------------------------------------------------------------------------
// Backward-compat aliases (consumed by narrator.ts and other shared modules)
// ---------------------------------------------------------------------------

/** @deprecated Use narratorEventPrompt */
export function buildNarrationPrompt(
  tone: string,
  sceneContext: string,
  event: string
): string {
  return `Narrate the following game event in one line (max 20 words).
Tone: ${tone}
Scene: ${sceneContext}
Event: ${event}
Return ONLY the narration text, no quotes.`;
}

/** @deprecated Use personificationPrompt */
export function buildPersonificationPrompt(
  objectLabel: string,
  sceneContext: string,
  genre: StoryGenre
): string {
  return personificationPrompt(objectLabel, sceneContext, genre, []);
}

/** @deprecated Use dialoguePrompt */
export function buildDialoguePrompt(
  characterName: string,
  personality: string,
  voiceStyle: string,
  emotionalState: string,
  interactionMode: string,
  userMessage: string,
  memoryContext: string
): string {
  return `You are ${characterName}, a ${personality}. Voice: ${voiceStyle}. State: ${emotionalState}. The user is trying to ${interactionMode} you. ${memoryContext}
User: "${userMessage}"
Return JSON: { "response": string, "relationshipDelta": number, "newEmotionalState": string }`;
}
