"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { STORY_GENRES } from "@/lib/constants";
import { modeUrl } from "@/lib/utils";
import type { ActiveMode, StoryGenre } from "@/types";

interface ModeSelectorProps {
  className?: string;
}

/**
 * Landing-page mode and genre selector.
 * Routes to /story?genre=X or /quest.
 */
export function ModeSelector({ className }: ModeSelectorProps) {
  const router = useRouter();
  const [selectedMode, setSelectedMode] = useState<ActiveMode | null>(null);
  const [selectedGenre, setSelectedGenre] = useState<StoryGenre>("mystery");

  const handleLaunch = () => {
    if (!selectedMode) return;
    router.push(modeUrl(selectedMode, selectedMode === "story" ? selectedGenre : undefined));
  };

  return (
    <div className={cn("flex flex-col gap-6 w-full max-w-sm mx-auto", className)}>
      {/* Mode toggle */}
      <div className="grid grid-cols-2 gap-3">
        <ModeCard
          selected={selectedMode === "story"}
          onSelect={() => setSelectedMode("story")}
          icon="🎭"
          title="Story Mode"
          tagline="Your world has feelings"
          accentClass="border-[#7b3fc4]/50 bg-[#7b3fc4]/10"
          activeClass="border-[#c89b3c] bg-gradient-to-br from-[#7b3fc4]/20 to-[#c89b3c]/10 border-glow-story"
        />
        <ModeCard
          selected={selectedMode === "quest"}
          onSelect={() => setSelectedMode("quest")}
          icon="⚡"
          title="Quest Mode"
          tagline="Your life has missions"
          accentClass="border-[#0066aa]/50 bg-[#0066aa]/10"
          activeClass="border-[#00d4ff] bg-gradient-to-br from-[#0066aa]/20 to-[#00d4ff]/10 border-glow-quest"
        />
      </div>

      {/* Genre picker (story only) */}
      {selectedMode === "story" && (
        <div className="animate-fade-up">
          <p className="font-body text-white/50 text-xs tracking-widest uppercase mb-3 px-1">
            Choose your genre
          </p>
          <div className="grid grid-cols-3 gap-2">
            {STORY_GENRES.map((g) => (
              <button
                key={g.value}
                onClick={() => setSelectedGenre(g.value)}
                className={cn(
                  "touch-target flex flex-col items-center gap-1 py-3 px-2 rounded-xl border transition-all duration-200",
                  selectedGenre === g.value
                    ? "border-[#c89b3c]/60 bg-[#c89b3c]/10 text-[#c89b3c]"
                    : "border-white/10 bg-white/5 text-white/60 active:bg-white/10"
                )}
              >
                <span className="text-xl">{g.emoji}</span>
                <span className="font-body text-[10px] font-medium tracking-wide text-center leading-tight">
                  {g.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Camera permission hint */}
      {selectedMode && (
        <div className="animate-fade-in glass rounded-xl px-4 py-3 flex items-start gap-3">
          <span className="text-lg shrink-0 mt-0.5">📸</span>
          <p className="font-body text-white/60 text-xs leading-relaxed">
            {selectedMode === "story"
              ? "Point your camera at your surroundings to bring them to life."
              : "Point your camera at your environment to activate context-aware missions."}
            <br />
            <span className="text-white/40">Camera access required.</span>
          </p>
        </div>
      )}

      {/* Launch CTA */}
      <button
        onClick={handleLaunch}
        disabled={!selectedMode}
        className={cn(
          "w-full py-4 rounded-2xl font-semibold text-base tracking-wide transition-all duration-300",
          selectedMode === "story"
            ? "btn-story"
            : selectedMode === "quest"
            ? "btn-quest"
            : "bg-white/5 text-white/30 border border-white/10 cursor-not-allowed"
        )}
      >
        {!selectedMode
          ? "Choose a mode"
          : selectedMode === "story"
          ? "Enter Story Mode →"
          : "BEGIN MISSION →"}
      </button>
    </div>
  );
}

interface ModeCardProps {
  selected: boolean;
  onSelect: () => void;
  icon: string;
  title: string;
  tagline: string;
  accentClass: string;
  activeClass: string;
}

function ModeCard({ selected, onSelect, icon, title, tagline, accentClass, activeClass }: ModeCardProps) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "touch-target flex flex-col items-start gap-2 p-4 rounded-2xl border transition-all duration-300 text-left",
        selected ? activeClass : cn("border-white/10 bg-white/5", accentClass)
      )}
    >
      <span className="text-2xl">{icon}</span>
      <div>
        <p className={cn("font-semibold text-sm", selected ? "text-white" : "text-white/80")}>
          {title}
        </p>
        <p className="font-body text-[11px] text-white/50 mt-0.5 leading-tight">{tagline}</p>
      </div>
    </button>
  );
}
