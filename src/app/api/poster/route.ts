// POST /api/poster — generate end-of-session recap poster

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/shared/sessions";
import { visualGenerator } from "@/lib/shared/nanobanana";
import { safeGenerateJSON } from "@/lib/shared/gemini";
import { recapPosterPrompt } from "@/lib/shared/prompts";
import type { PosterRequest, PosterResponse } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as PosterRequest;
    const session = getSession(body.sessionId);
    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

    const durationMin = Math.round((Date.now() - session.startedAt) / 60000);
    const mode = session.activeMode;

    const highlights: string[] = [];
    if (mode === "story" && session.storyState) {
      highlights.push(...session.storyState.characters.slice(0, 3).map((c) => `${c.name} the ${c.personality}`));
      highlights.push(...session.storyState.activeQuests.filter((q) => q.status === "completed").map((q) => q.title));
    } else if (mode === "quest" && session.questState) {
      highlights.push(...session.questState.missions.filter((m) => m.status === "completed").map((m) => m.codename));
    }

    let title = mode === "story" ? "Episode: Untitled" : "Campaign: Untitled";
    let tagline = "A session occurred.";
    let imagePrompt = `Cinematic ${mode} game recap poster`;

    const metaResult = await safeGenerateJSON<{
      imagePrompt: string;
      posterTitle: string;
      tagline: string;
    }>(recapPosterPrompt(mode, highlights, durationMin, title));

    if (metaResult) {
      title = metaResult.posterTitle;
      tagline = metaResult.tagline;
      imagePrompt = metaResult.imagePrompt;
    }

    const visual = await visualGenerator.generate({
      type: "recap_poster",
      prompt: imagePrompt,
      style: mode === "story" ? "dramatic movie poster" : "military campaign poster",
      sessionContext: highlights.join(", "),
    });

    const response: PosterResponse = {
      posterUrl: visual.imageUrl || null,
      title,
      tagline,
      summary: tagline,
      highlights,
      generatedAt: Date.now(),
      isFallback: visual.isFallback,
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error("[/api/poster]", err);
    return NextResponse.json({ error: "Poster generation failed" }, { status: 500 });
  }
}
