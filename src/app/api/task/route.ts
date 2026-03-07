// POST /api/task — Quest Mode: add a task, get framed mission
// GET  /api/task?sessionId — list all missions

import { NextRequest, NextResponse } from "next/server";
import { getSession, patchSession } from "@/lib/shared/sessions";
import { missionFramer } from "@/lib/quest/missionFramer";
import { taskManager } from "@/lib/quest/taskManager";
import type { AddTaskRequest, AddTaskResponse, ListMissionsResponse } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as AddTaskRequest;
    const session = getSession(body.sessionId);

    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
    if (session.activeMode !== "quest") return NextResponse.json({ error: "Quest Mode only" }, { status: 400 });
    if (!body.taskText?.trim()) return NextResponse.json({ error: "taskText is required" }, { status: 400 });

    const questState = session.questState!;
    const recentMissions = questState.missions.slice(-5).map((m) => m.originalTask).join(", ");

    const mission = await missionFramer.frame(
      body.taskText.trim(),
      session.sceneGraph.sceneType,
      recentMissions
    );

    const updatedQuestState = taskManager.addMission(questState, mission);
    patchSession(body.sessionId, { questState: updatedQuestState });

    const response: AddTaskResponse = { mission };
    return NextResponse.json(response);
  } catch (err) {
    console.error("[/api/task POST]", err);
    return NextResponse.json({ error: "Failed to add task" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get("sessionId");
    if (!sessionId) return NextResponse.json({ error: "sessionId required" }, { status: 400 });

    const session = getSession(sessionId);
    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

    const response: ListMissionsResponse = { missions: session.questState?.missions ?? [] };
    return NextResponse.json(response);
  } catch (err) {
    console.error("[/api/task GET]", err);
    return NextResponse.json({ error: "Failed to list missions" }, { status: 500 });
  }
}
