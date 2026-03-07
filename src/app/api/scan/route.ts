// POST /api/scan — process a camera frame, update scene graph
// Story Mode: returns character + relationship updates via storyHooks
// Quest Mode: returns context matches + mission activations via questHooks

import { NextRequest, NextResponse } from "next/server";
import { getSession, patchSession } from "@/lib/shared/sessions";
import { safeAnalyzeImageJSON } from "@/lib/shared/gemini";
import { sceneAnalysisPrompt } from "@/lib/shared/prompts";
import { personification } from "@/lib/story/personification";
import { relationshipManager } from "@/lib/story/relationships";
import { contextDetector } from "@/lib/quest/contextDetector";
import type {
  ScanRequest,
  ScanResponse,
  SceneGraph,
  NarrationEvent,
} from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ScanRequest;
    const session = getSession(body.sessionId);
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const prompt = sceneAnalysisPrompt(session.activeMode);
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
      const existingLabels = new Set(storyState.characters.map((c) => c.objectLabel));
      const newObjects = sceneGraph.objects.filter((o) => !existingLabels.has(o.label));

      const newCharacters = await Promise.all(
        newObjects.map((obj) =>
          personification.personify(obj, storyState.genre, storyState.characters)
        )
      );

      const allCharacters = [...storyState.characters, ...newCharacters];
      const relationships = newCharacters.length > 0
        ? relationshipManager.generateInterObjectRelationships(allCharacters)
        : storyState.relationships;

      const updatedStoryState = { ...storyState, characters: allCharacters, relationships };
      sessionPatch.storyState = updatedStoryState;
      response.storyHooks = { newCharacters: newCharacters.map((c) => c.id) };
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
