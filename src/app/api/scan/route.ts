// POST /api/scan — process a camera frame, update scene graph
// Story Mode: returns character + relationship updates via storyHooks
// Quest Mode: returns context matches + mission activations via questHooks

import { NextRequest, NextResponse } from "next/server";
import { getSession, patchSession } from "@/lib/shared/sessions";
import { safeAnalyzeImageJSON } from "@/lib/shared/gemini";
import { visualGenerator } from "@/lib/shared/nanobanana";
import { sceneAnalysisPrompt } from "@/lib/shared/prompts";
import { personification } from "@/lib/story/personification";
import { relationshipManager } from "@/lib/story/relationships";
import { contextDetector } from "@/lib/quest/contextDetector";
import type {
  ScanRequest,
  ScanResponse,
  SceneGraph,
  DetectedObject,
  NarrationEvent,
} from "@/types";

const MAJOR_OBJECT_MIN_SALIENCE = 0.6;
const BACKGROUND_OBJECT_HIGH_SALIENCE = 0.82;
const MAX_NEW_CHARACTERS_PER_SCAN = 3;

function normalizeObjectLabel(label: string): string {
  return label.trim().toLowerCase();
}

function isMajorObject(object: DetectedObject): boolean {
  if ((object.salience ?? 0) >= BACKGROUND_OBJECT_HIGH_SALIENCE) return true;
  return (
    (object.salience ?? 0) >= MAJOR_OBJECT_MIN_SALIENCE &&
    object.position !== "background"
  );
}

function buildCharacterPortraitPrompt(input: {
  name: string;
  objectLabel: string;
  personality: string;
  emotionalState: string;
  genre: string;
  context?: string;
}): string {
  const genreStyleHints: Record<string, string> = {
    dating_sim:       "soft pastel palette, romantic sparkles, shoujo manga linework",
    mystery:          "film noir shadows, cool blue-grey palette, heavy ink outlines",
    fantasy:          "vibrant high-fantasy colors, dynamic spell-casting pose, glowing effects",
    survival:         "gritty post-apocalyptic palette, battle-worn, dramatic shadows",
    workplace_drama:  "sharp corporate suit, office satire cartoon style, bold outlines",
    soap_opera:       "telenovela glamour, vivid warm colors, theatrical expression",
  };
  const genreStyle = genreStyleHints[input.genre] ?? "bold vibrant colors, dramatic lighting";
  const contextHint = input.context?.trim()
    ? `Context clue: ${input.context}.`
    : "";
  return [
    `Comic-book illustration of ${input.name}, a ${input.personality} character who is a personified ${input.objectLabel}.`,
    `They look ${input.emotionalState}.`,
    `Art style: ${genreStyle}, 2D illustrated character sprite, thick ink outlines, cel-shading.`,
    contextHint,
    "FULL BODY from head to toe, standing centered.",
    "TRANSPARENT BACKGROUND — character isolated with no background scenery, no ground, no floor, no environment behind them.",
    "Show complete legs and feet. Do NOT crop at waist or chest. Single character only.",
    "No text, no speech bubbles, no watermark. Ultra-high detail illustration.",
  ].filter(Boolean).join(" ");
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ScanRequest;
    const session = getSession(body.sessionId);
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const prompt = sceneAnalysisPrompt(session.activeMode, session.storyState?.genre);
    let sceneGraph: SceneGraph;

    const result = await safeAnalyzeImageJSON<SceneGraph>(body.frame, prompt);
    if (result) {
      sceneGraph = { ...result, capturedAt: Date.now() };
    } else {
      sceneGraph = { ...session.sceneGraph, capturedAt: Date.now() };
    }

    const sessionPatch: Partial<typeof session> = { sceneGraph };
    if (body.location) sessionPatch.location = body.location;

    const response: ScanResponse = {
      sceneGraph,
      narration: {
        text: "The scene has been analyzed.",
        tone: "documentary",
        timestamp: Date.now(),
        sourceMode: session.activeMode,
      } satisfies NarrationEvent,
    };

    if (session.activeMode === "story") {
      const storyState = session.storyState!;
      const existingLabels = new Set(
        storyState.characters.map((c) => normalizeObjectLabel(c.objectLabel))
      );
      const newObjects = sceneGraph.objects.filter(
        (o) => !existingLabels.has(normalizeObjectLabel(o.label))
      );
      const majorNewObjects = newObjects
        .filter(isMajorObject)
        .sort((a, b) => (b.salience ?? 0) - (a.salience ?? 0))
        .slice(0, MAX_NEW_CHARACTERS_PER_SCAN);

      // Personify only major newly detected objects and generate portraits.
      const newCharactersWithPortraits: typeof storyState.characters =
        majorNewObjects.length > 0
          ? await Promise.all(
              majorNewObjects.map(async (obj) => {
                const character = await personification.personify(
                  obj,
                  storyState.genre,
                  storyState.characters
                );
                const portraitPrompt = buildCharacterPortraitPrompt({
                  name: character.name,
                  objectLabel: character.objectLabel,
                  personality: character.personality,
                  emotionalState: character.emotionalState,
                  genre: storyState.genre,
                  context: obj.context,
                });
                const portraitResult = await visualGenerator.generate({
                  type: "character_portrait",
                  prompt: portraitPrompt,
                  style: "cinematic full-body character sprite render",
                  sessionContext: `${storyState.genre} ${character.objectLabel}`,
                });
                return {
                  ...character,
                  portraitUrl: portraitResult?.imageUrl || undefined,
                };
              })
            )
          : [];

      const allCharacters = [...storyState.characters, ...newCharactersWithPortraits];
      const relationships = newCharactersWithPortraits.length > 0
        ? relationshipManager.generateInterObjectRelationships(allCharacters)
        : storyState.relationships;

      const updatedStoryState = { ...storyState, characters: allCharacters, relationships };
      sessionPatch.storyState = updatedStoryState;
      response.storyHooks = { newCharacters: newCharactersWithPortraits.map((c) => c.id) };
      // Return full state so clients can sync without a separate round-trip
      response.updatedStoryState = updatedStoryState;
    } else {
      const questState = session.questState!;
      const { activations, matches } = contextDetector.match(sceneGraph, questState.missions);

      let updatedQuestState = questState;
      if (activations.length > 0) {
        const missions = questState.missions.map((m) =>
          activations.includes(m.id) ? { ...m, status: "active" as const, startedAt: Date.now() } : m
        );
        updatedQuestState = {
          ...questState,
          missions,
          activeMissionId: activations[0] ?? questState.activeMissionId,
        };
        sessionPatch.questState = updatedQuestState;
      }

      response.questHooks = { contextMatches: matches, missionActivations: activations };
      // Return full state so clients can sync without a separate round-trip
      response.updatedQuestState = updatedQuestState;
    }

    patchSession(body.sessionId, sessionPatch);

    return NextResponse.json(response);
  } catch (err) {
    console.error("[/api/scan]", err);
    return NextResponse.json({ error: "Scan failed" }, { status: 500 });
  }
}
