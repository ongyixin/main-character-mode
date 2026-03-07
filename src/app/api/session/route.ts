// POST /api/session — create a new game session

import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/shared/sessions";
import type { CreateSessionRequest, CreateSessionResponse } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CreateSessionRequest;
    if (!body.mode || !["story", "quest"].includes(body.mode)) {
      return NextResponse.json({ error: "mode must be 'story' or 'quest'" }, { status: 400 });
    }

    const session = createSession(body.mode, body.genre);
    const response: CreateSessionResponse = {
      sessionId: session.id,
      initialState: session,
    };
    return NextResponse.json(response);
  } catch (err) {
    console.error("[/api/session]", err);
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }
}
