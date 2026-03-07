"use client";

export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { RecapPoster } from "@/components/shared/RecapPoster";
import { cn } from "@/lib/cn";
import { MOCK_STORY_SESSION, MOCK_QUEST_SESSION, MOCK_CAMPAIGN_RECAP } from "@/lib/mock-data";
import type { ActiveMode } from "@/types";

function RecapContent() {
  const searchParams = useSearchParams();
  const mode = (searchParams.get("mode") ?? "story") as ActiveMode;
  const isStory = mode === "story";

  const session = (isStory ? MOCK_STORY_SESSION : MOCK_QUEST_SESSION) as import("@/types").SessionState;
  const durationMinutes = Math.round((Date.now() - session.startedAt) / 1000 / 60);
  const highlights = isStory
    ? [
        "Lumina formed an unexpected alliance",
        "The Stolen Light quest completed",
        `+${session.progression.xp} XP earned`,
      ]
    : [
        MOCK_CAMPAIGN_RECAP.highlightMission,
        `${MOCK_CAMPAIGN_RECAP.missionsCompleted} missions completed`,
        `Longest combo: ×${MOCK_CAMPAIGN_RECAP.longestCombo}`,
      ];

  return (
    <div
      className="relative h-full w-full overflow-hidden flex flex-col"
      style={{ background: isStory ? "var(--story-bg)" : "var(--quest-bg)" }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: isStory
            ? "radial-gradient(ellipse at 30% 20%, rgba(123,63,196,0.3) 0%, transparent 55%), radial-gradient(ellipse at 70% 80%, rgba(200,155,60,0.2) 0%, transparent 55%)"
            : "radial-gradient(ellipse at 20% 80%, rgba(0,102,170,0.35) 0%, transparent 55%), radial-gradient(ellipse at 80% 20%, rgba(0,212,255,0.15) 0%, transparent 55%)",
        }}
      />

      <div className="relative z-10 flex flex-col flex-1 overflow-y-auto safe-top safe-bottom px-5 py-6 gap-5">
        <div className="flex items-center justify-between">
          <a
            href={`/${mode}`}
            className={cn(
              "touch-target px-3 py-2 rounded text-xs tracking-widest uppercase",
              isStory ? "glass-story text-[#c89b3c]/70 font-display" : "glass-quest text-[#00d4ff]/60 font-mono-dm"
            )}
          >
            ← Back
          </a>
          <span className={cn("text-[10px] tracking-[0.2em] uppercase", isStory ? "font-display text-[#c89b3c]/50" : "font-mono-dm text-[#00d4ff]/40")}>
            {isStory ? "Episode Complete" : "Campaign Debrief"}
          </span>
        </div>

        <RecapPoster
          mode={mode}
          genre={(session as import("@/types").SessionState).storyState?.genre}
          durationMinutes={durationMinutes}
          totalXP={session.progression.xp}
          highlights={highlights}
        />

        <div className="flex flex-col gap-3">
          <button
            className={cn("w-full py-4 rounded-2xl text-sm font-semibold", isStory ? "btn-story" : "btn-quest")}
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: "Main Character Mode", text: "I was the main character." });
              }
            }}
          >
            {isStory ? "Share Episode ↗" : "SHARE DEBRIEF ↗"}
          </button>

          <a href="/" className="w-full py-4 rounded-2xl text-sm font-medium text-center block btn-ghost">
            Play Again
          </a>
        </div>
      </div>
    </div>
  );
}

export default function RecapPage() {
  return (
    <Suspense fallback={<div className="h-full w-full" />}>
      <RecapContent />
    </Suspense>
  );
}
