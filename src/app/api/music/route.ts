// GET /api/music?sessionId — current music track for the session

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getSession, patchSession } from "@/lib/shared/sessions";
import { deriveMusicState, musicController, TRACK_METADATA } from "@/lib/shared/lyria";
import type { MusicResponse, LyriaControlSignal } from "@/types";

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get("sessionId");
    if (!sessionId) return NextResponse.json({ error: "sessionId required" }, { status: 400 });

    const session = getSession(sessionId);
    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

    const { sceneGraph, activeMode } = session;
    const derived = deriveMusicState(
      activeMode,
      session.storyState?.phase,
      session.questState?.momentum.currentCombo,
      session.questState?.momentum.sessionProductivityScore,
      sceneGraph.mood,
      session.storyState,
      session.narrativeLog
    );
    const tempo = derived.intensity > 0.7 ? "fast" : derived.intensity > 0.4 ? "medium" : "slow";

    const signal: LyriaControlSignal = {
      mood: derived.mood,
      tempo,
      intensity: derived.intensity,
      environment: sceneGraph.sceneType,
      activeMode,
    };

    const track = await musicController.getTrack(signal);
    patchSession(sessionId, {
      musicState: {
        ...session.musicState,
        mood: signal.mood,
        tempo: signal.tempo,
        intensity: signal.intensity,
        environment: sceneGraph.sceneType,
        trackUrl: track.url || null,
        trackLabel: TRACK_METADATA[track.mood]?.label ?? String(track.mood),
        isFallback: !track.url || track.url.startsWith("/audio/fallback/"),
        lastUpdatedAt: Date.now(),
      },
    });

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
