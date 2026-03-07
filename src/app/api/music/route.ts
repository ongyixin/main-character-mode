// GET /api/music?sessionId — current music track for the session

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/shared/sessions";
import { musicController, TRACK_METADATA } from "@/lib/shared/lyria";
import type { MusicResponse, LyriaControlSignal } from "@/types";

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get("sessionId");
    if (!sessionId) return NextResponse.json({ error: "sessionId required" }, { status: 400 });

    const session = getSession(sessionId);
    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

    const { musicState, sceneGraph, activeMode } = session;

    const signal: LyriaControlSignal = {
      mood: musicState.mood,
      tempo: musicState.tempo ?? "medium",
      intensity: musicState.intensity,
      environment: sceneGraph.sceneType,
      activeMode,
    };

    const track = await musicController.getTrack(signal);

    const response: MusicResponse = {
      mood: track.mood,
      intensity: signal.intensity,
      trackUrl: track.url || null,
      trackLabel: TRACK_METADATA[track.mood]?.label ?? String(track.mood),
      isFallback: !track.url || track.url.startsWith("/audio/fallback/"),
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error("[/api/music]", err);
    return NextResponse.json({ error: "Music fetch failed" }, { status: 500 });
  }
}
