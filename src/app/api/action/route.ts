// POST /api/action — Story Mode: accept/complete quests, make choices

import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { getSession, patchSession } from "@/lib/shared/sessions";
import { progression } from "@/lib/shared/progression";
import type { ActionRequest, ActionResponse, NarrationEvent } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ActionRequest;
    const session = getSession(body.sessionId);

    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
    if (session.activeMode !== "story") return NextResponse.json({ error: "Story Mode only" }, { status: 400 });

    let storyState = session.storyState!;
    let progressionState = session.progression;
    let xpEarned = 0;

    switch (body.actionType) {
      case "accept_quest": {
        const questId = body.payload.questId as string;
        storyState = {
          ...storyState,
          activeQuests: storyState.activeQuests.map((q) =>
            q.id === questId ? { ...q, status: "active" } : q
          ),
          phase: "quest_active",
        };
        break;
      }
      case "complete_quest": {
        const questId = body.payload.questId as string;
        const quest = storyState.activeQuests.find((q) => q.id === questId);
        xpEarned = quest?.xpReward ?? 100;
        storyState = {
          ...storyState,
          activeQuests: storyState.activeQuests.map((q) =>
            q.id === questId ? { ...q, status: "completed" } : q
          ),
        };
        progressionState = progression.awardXP(progressionState, xpEarned);
        break;
      }
      case "fail_quest": {
        const questId = body.payload.questId as string;
        storyState = {
          ...storyState,
          activeQuests: storyState.activeQuests.map((q) =>
            q.id === questId ? { ...q, status: "failed" } : q
          ),
        };
        break;
      }
      case "make_choice":
      case "use_item":
        // Story Mode Agent integration point
        break;
    }

    patchSession(body.sessionId, { storyState, progression: progressionState });

    const narration: NarrationEvent = {
      id: uuidv4(),
      text: body.actionType === "accept_quest"
        ? "The quest is accepted. The room takes note."
        : body.actionType === "complete_quest"
        ? "It is done. Someone will remember this."
        : "Something changed.",
      tone: "documentary",
      timestamp: Date.now(),
      sourceMode: "story",
    };

    const response: ActionResponse = {
      gameUpdate: storyState,
      narration,
      xpEarned: xpEarned || undefined,
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error("[/api/action]", err);
    return NextResponse.json({ error: "Action failed" }, { status: 500 });
  }
}
