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
 * Story Mode page shell.
 *
 * Layer stack (bottom → top):
 *   0. Camera feed (full-screen background)
 *   1. Atmosphere gradient overlay
 *   2. Floating ObjectLabels (per character in storyState.characters)
 *   3. StoryHUD (top-left)
 *   4. NarrationBanner (bottom)
 *   5. InteractionModal (conditional)
 *
 * Story Agent replaces mock session with live state from /api/session and /api/scan.
 */
function StoryContent() {
  const searchParams = useSearchParams();
  const genre = (searchParams.get("genre") ?? "mystery") as StoryGenre;

  // ── State (Story Agent replaces with real API state) ─────────────────────
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
    // Story Agent: trigger Camera scan → POST /api/scan
    setScanLoading(true);
    setTimeout(() => setScanLoading(false), 2000);
  }, []);

  const handleTalk = useCallback(
    async (mode: InteractionMode, message: string) => {
      // Story Agent: POST /api/talk with { sessionId, characterId, interactionMode, message }
      console.log("[Story] talk:", selectedCharacter?.id, mode, message);
      return null;
    },
    [selectedCharacter]
  );

  return (
    <div className="relative h-full w-full overflow-hidden" style={{ background: "var(--story-bg)" }}>
      {/* Layer 0: Camera feed — renders full-screen via absolute positioning */}
      <div className="absolute inset-0 z-0">
        <Camera className="w-full h-full object-cover opacity-40" mode="story" />
      </div>

      {/* Layer 1: Atmosphere overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          background:
            "radial-gradient(ellipse at 30% 20%, rgba(123,63,196,0.25) 0%, transparent 50%), " +
            "radial-gradient(ellipse at 70% 80%, rgba(200,155,60,0.15) 0%, transparent 50%), " +
            "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 40%, rgba(0,0,0,0.6) 100%)",
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
      <div className="absolute top-0 left-0 z-[20] safe-top px-4 py-3">
        <StoryHUD
          storyState={storyState}
          sessionStartedAt={sessionState.startedAt}
          onScan={handleScan}
          onSelectCharacter={setSelectedCharacter}
          scanLoading={scanLoading}
          selectedCharacterId={selectedCharacter?.id}
        />
      </div>

      {/* Back button */}
      <div className="absolute top-0 right-0 z-[20] safe-top px-4 py-3">
        <a
          href="/"
          className="glass-story rounded-xl px-3 py-2 font-display text-[#c89b3c]/70 text-xs touch-target block"
        >
          ← Exit
        </a>
      </div>

      {/* Layer 4: Narration banner */}
      <div className="absolute bottom-0 left-0 right-0 z-[30] safe-bottom pb-4">
        <NarrationBanner event={latestNarration} autoDismissMs={8000} />
      </div>

      {/* Layer 5: Interaction modal */}
      {selectedCharacter && (
        <InteractionModal
          character={selectedCharacter}
          onClose={() => setSelectedCharacter(null)}
          onTalk={handleTalk}
        />
      )}

      {/* Scan corners */}
      <ScanCorners />
    </div>
  );
}

function ScanCorners() {
  return (
    <div className="absolute inset-4 pointer-events-none z-[5]" aria-hidden>
      <div className="absolute top-0 left-0 w-6 h-6 border-t border-l border-[#c89b3c]/30 rounded-tl-lg" />
      <div className="absolute top-0 right-0 w-6 h-6 border-t border-r border-[#c89b3c]/30 rounded-tr-lg" />
      <div className="absolute bottom-0 left-0 w-6 h-6 border-b border-l border-[#c89b3c]/30 rounded-bl-lg" />
      <div className="absolute bottom-0 right-0 w-6 h-6 border-b border-r border-[#c89b3c]/30 rounded-br-lg" />
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
          <div className="text-white/40 text-sm tracking-widest uppercase font-display animate-pulse">
            Loading…
          </div>
        </div>
      }
    >
      <StoryContent />
    </Suspense>
  );
}
