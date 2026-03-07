"use client";

export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { RecapPoster } from "@/components/shared/RecapPoster";
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

  const borderColor = isStory ? "#FFDE00" : "#FFDE00";
  const innerBorder = isStory ? "#CC0000" : "#3B4CCA";
  const bg = isStory ? "#06040e" : "#06040e";
  const accentColor = isStory ? "#FFDE00" : "#FFDE00";
  const shadowColor = isStory ? "rgba(204,0,0,0.5)" : "rgba(59,76,202,0.5)";
  const textColor = isStory ? "#FFF0B0" : "#B0C4FF";

  return (
    <div
      className="relative h-full w-full overflow-hidden flex flex-col pixel-grid"
      style={{ background: bg }}
    >
      {/* Background atmosphere */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: isStory
            ? "radial-gradient(ellipse at 30% 20%, rgba(204,0,0,0.3) 0%, transparent 55%), radial-gradient(ellipse at 70% 80%, rgba(255,222,0,0.1) 0%, transparent 55%)"
            : "radial-gradient(ellipse at 20% 80%, rgba(59,76,202,0.3) 0%, transparent 55%), radial-gradient(ellipse at 80% 20%, rgba(59,76,202,0.06) 0%, transparent 55%)",
        }}
      />
      {/* Scanlines */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.07) 3px, rgba(0,0,0,0.07) 4px)",
        }}
      />

      <div className="relative z-10 flex flex-col flex-1 overflow-y-auto safe-top safe-bottom px-4 py-5 gap-4">
        {/* Header chrome */}
        <div
          className="flex items-center justify-between"
          style={{
            border: `2px solid ${innerBorder}`,
            background: isStory ? "rgba(30,6,6,0.95)" : "rgba(6,8,30,0.95)",
            boxShadow: `2px 2px 0 ${shadowColor}`,
            padding: "8px 12px",
          }}
        >
          <a
            href={`/${mode}`}
            className="font-pixel text-base touch-target"
            style={{ color: `${accentColor}80` }}
          >
            ← BACK
          </a>
          <span className="font-pixel text-base tracking-wider" style={{ color: `${accentColor}50` }}>
            {isStory ? "★ EPISODE COMPLETE ★" : "[ CAMPAIGN DEBRIEF ]"}
          </span>
        </div>

        {/* Poster */}
        <RecapPoster
          mode={mode}
          genre={(session as import("@/types").SessionState).storyState?.genre}
          durationMinutes={durationMinutes}
          totalXP={session.progression.xp}
          highlights={highlights}
        />

        {/* Action buttons */}
        <div className="flex flex-col gap-2">
          <button
            className="w-full touch-target font-pixel active:translate-x-[2px] active:translate-y-[2px]"
            style={{
              background: accentColor,
              border: `2px solid ${innerBorder}`,
              boxShadow: `3px 3px 0 ${shadowColor}`,
              color: isStory ? "#1a0800" : "#0a0e30",
              fontSize: "12px",
              letterSpacing: "0.1em",
              padding: "16px 16px",
              transition: "box-shadow 0.05s, transform 0.05s",
            }}
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: "Main Character Mode", text: "I was the main character." });
              }
            }}
          >
            {isStory ? "▶ SHARE EPISODE" : "▶ SHARE DEBRIEF"}
          </button>

          <a
            href="/"
            className="w-full touch-target font-pixel text-center flex items-center justify-center active:translate-x-[1px] active:translate-y-[1px]"
            style={{
              background: "transparent",
              border: `2px solid rgba(255,255,255,0.18)`,
              boxShadow: "2px 2px 0 rgba(255,255,255,0.06)",
              color: "rgba(255,255,255,0.4)",
              fontSize: "12px",
              letterSpacing: "0.1em",
              padding: "14px 16px",
              transition: "box-shadow 0.05s, transform 0.05s",
            }}
          >
            ↩ PLAY AGAIN
          </a>
        </div>

        {/* Footer */}
        <p className="text-center font-pixel" style={{ color: `${accentColor}15`, fontSize: "9px", letterSpacing: "0.15em" }}>
          MAIN CHARACTER MODE — YC × GOOGLE DEEPMIND
        </p>
      </div>
    </div>
  );
}

export default function RecapPage() {
  return (
    <Suspense fallback={<div className="h-full w-full" style={{ background: "#06040e" }} />}>
      <RecapContent />
    </Suspense>
  );
}
