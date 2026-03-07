"use client";

import { Suspense, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { StoryHUD } from "@/components/story/StoryHUD";
import { ObjectLabel } from "@/components/story/ObjectLabel";
import { InteractionModal } from "@/components/story/InteractionModal";
import NarrationBanner from "@/components/shared/NarrationBanner";
import { Camera } from "@/components/shared/Camera";
import { MOCK_STORY_SESSION } from "@/lib/mock-data";
import type {
  ObjectCharacter,
  InteractionMode,
  StoryGenre,
} from "@/types";

/**
 * Story Mode page shell — pixel-retro AR RPG overlay.
 *
 * Layer stack (bottom → top):
 *   0. Camera feed (full-screen background)
 *   1. Dark tint + pixel grid overlay
 *   2. Floating ObjectLabels (per character — retro NPC tags)
 *   3. StoryHUD (bottom)
 *   4. NarrationBanner (top)
 *   5. InteractionModal (conditional — RPG dialogue box)
 */
function StoryContent() {
  const searchParams = useSearchParams();
  const genre = (searchParams.get("genre") ?? "mystery") as StoryGenre;

  const [session] = useState({
    ...MOCK_STORY_SESSION,
    storyState: MOCK_STORY_SESSION.storyState
      ? { ...MOCK_STORY_SESSION.storyState, genre }
      : undefined,
  });

  const [selectedCharacter, setSelectedCharacter] = useState<ObjectCharacter | null>(null);
  const [scanLoading, setScanLoading] = useState(false);

  const storyState = (session as import("@/types").SessionState).storyState ?? null;
  const sessionState = session as import("@/types").SessionState;
  const latestNarration = sessionState.narrativeLog[sessionState.narrativeLog.length - 1] ?? null;

  const handleScan = useCallback(() => {
    setScanLoading(true);
    setTimeout(() => setScanLoading(false), 2000);
  }, []);

  const handleTalk = useCallback(
    async (mode: InteractionMode, message: string) => {
      console.log("[Story] talk:", selectedCharacter?.id, mode, message);
      return null;
    },
    [selectedCharacter]
  );

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{ background: "var(--story-bg)" }}
    >
      {/* Layer 0: Camera feed */}
      <div className="absolute inset-0 z-0">
        <Camera className="w-full h-full object-cover opacity-35" mode="story" />
      </div>

      {/* Layer 1: Dark atmosphere + pixel grid */}
      <div
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          background:
            "radial-gradient(ellipse at 30% 25%, rgba(204,0,0,0.22) 0%, transparent 50%), " +
            "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 35%, rgba(0,0,0,0.65) 100%)",
        }}
      />
      {/* Scanlines */}
      <div
        className="absolute inset-0 pointer-events-none z-[2]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.07) 3px, rgba(0,0,0,0.07) 4px)",
        }}
      />

      {/* Layer 2: Floating ObjectLabels */}
      {storyState?.characters.map((character: import("@/types").ObjectCharacter, i: number) => {
        const sceneObject = sessionState.sceneGraph.objects.find((o) => o.id === character.id);
        return (
          <ObjectLabel
            key={character.id}
            character={character}
            position={sceneObject?.position ?? "center"}
            index={i}
            isSelected={selectedCharacter?.id === character.id}
            onClick={() => setSelectedCharacter(character)}
          />
        );
      })}

      {/* Layer 3: StoryHUD */}
      <div className="absolute top-0 left-0 z-[20] safe-top px-3 py-3">
        <StoryHUD
          storyState={storyState}
          sessionStartedAt={sessionState.startedAt}
          onScan={handleScan}
          onSelectCharacter={setSelectedCharacter}
          scanLoading={scanLoading}
          selectedCharacterId={selectedCharacter?.id}
        />
      </div>

      {/* Exit button */}
      <div className="absolute top-0 right-0 z-[20] safe-top px-3 py-3">
        <a
          href="/"
          className="flex items-center touch-target"
          style={{
            background: "rgba(30,6,6,0.92)",
            border: "2px solid #CC0000",
            padding: "6px 12px",
            boxShadow: "2px 2px 0 rgba(204,0,0,0.5)",
          }}
        >
          <span className="font-pixel text-base" style={{ color: "rgba(255,222,0,0.7)" }}>
            ← EXIT
          </span>
        </a>
      </div>

      {/* Layer 4: Narration banner */}
      <div className="absolute top-0 left-0 right-0 z-[30] safe-top pt-16 px-3">
        <NarrationBanner event={latestNarration} mode="story" autoDismissMs={8000} />
      </div>

      {/* Layer 5: Interaction modal */}
      {selectedCharacter && (
        <InteractionModal
          character={selectedCharacter}
          onClose={() => setSelectedCharacter(null)}
          onTalk={handleTalk}
        />
      )}

      {/* Pixel corner brackets */}
      <PixelCorners color="rgba(255,222,0,0.4)" />
    </div>
  );
}

function PixelCorners({ color }: { color: string }) {
  return (
    <div className="absolute inset-3 pointer-events-none z-[5]" aria-hidden>
      {/* Top-left */}
      <div className="absolute top-0 left-0 w-5 h-5" style={{ borderTop: `2px solid ${color}`, borderLeft: `2px solid ${color}` }} />
      <div className="absolute top-0 left-0 w-2 h-2" style={{ background: color, opacity: 0.4, borderRadius: 0 }} />
      {/* Top-right */}
      <div className="absolute top-0 right-0 w-5 h-5" style={{ borderTop: `2px solid ${color}`, borderRight: `2px solid ${color}` }} />
      <div className="absolute top-0 right-0 w-2 h-2" style={{ background: color, opacity: 0.4 }} />
      {/* Bottom-left */}
      <div className="absolute bottom-0 left-0 w-5 h-5" style={{ borderBottom: `2px solid ${color}`, borderLeft: `2px solid ${color}` }} />
      <div className="absolute bottom-0 left-0 w-2 h-2" style={{ background: color, opacity: 0.4 }} />
      {/* Bottom-right */}
      <div className="absolute bottom-0 right-0 w-5 h-5" style={{ borderBottom: `2px solid ${color}`, borderRight: `2px solid ${color}` }} />
      <div className="absolute bottom-0 right-0 w-2 h-2" style={{ background: color, opacity: 0.4 }} />
    </div>
  );
}

export default function StoryPage() {
  return (
    <Suspense
      fallback={
        <div
          className="relative h-full w-full flex items-center justify-center"
          style={{ background: "var(--story-bg)" }}
        >
          <div
            className="border-2 px-8 py-6 text-center"
            style={{ borderColor: "#CC0000", boxShadow: "4px 4px 0 rgba(204,0,0,0.5)", background: "rgba(30,6,6,0.95)" }}
          >
            <p className="font-pixel text-base animate-pulse2" style={{ color: "#FFDE00" }}>
              LOADING...
            </p>
          </div>
        </div>
      }
    >
      <StoryContent />
    </Suspense>
  );
}
