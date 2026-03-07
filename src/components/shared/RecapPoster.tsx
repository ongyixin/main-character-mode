"use client";

import { cn } from "@/lib/cn";
import type { ActiveMode, StoryGenre, PosterResponse } from "@/types";

interface RecapPosterProps {
  mode: ActiveMode;
  genre?: StoryGenre;
  durationMinutes: number;
  totalXP: number;
  highlights: string[];
  posterUrl?: string;
  /** If posterUrl is absent (API unavailable), show placeholder */
  className?: string;
}

/**
 * Episode recap poster — shareable, screenshot-ready.
 * NanoBanana agent fills posterUrl via POST /api/poster.
 */
export function RecapPoster({
  mode,
  genre,
  durationMinutes,
  totalXP,
  highlights,
  posterUrl,
  className,
}: RecapPosterProps) {
  const isStory = mode === "story";

  return (
    <div
      className={cn(
        "relative w-full rounded-3xl overflow-hidden",
        isStory ? "glass-story border-glow-story" : "glass-quest border-glow-quest",
        className
      )}
      style={{ aspectRatio: "9/16", maxHeight: "70vh" }}
    >
      {/* Poster image or placeholder background */}
      {posterUrl ? (
        <img src={posterUrl} alt="Episode poster" className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <PosterPlaceholder mode={mode} genre={genre} />
      )}

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-6 gap-4">
        {/* Title */}
        <div>
          <p className={cn("text-[10px] tracking-[0.2em] uppercase mb-1", isStory ? "font-display text-[#c89b3c]/70" : "font-mono-dm text-[#00d4ff]/60")}>
            {isStory ? "Episode Complete" : "Campaign Debrief"}
          </p>
          <h2 className={cn("text-2xl font-bold leading-tight", isStory ? "font-display text-[#f0d898] text-glow-story" : "font-mono-dm text-[#00d4ff] text-glow-quest")}>
            {isStory ? `The ${formatGenre(genre ?? "mystery")} Session` : "MISSION COMPLETE"}
          </h2>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <StatChip label={isStory ? "XP Earned" : "TOTAL XP"} value={`+${totalXP}`} isStory={isStory} />
          <StatChip label={isStory ? "Duration" : "ELAPSED"} value={`${durationMinutes}m`} isStory={isStory} />
          <StatChip label={isStory ? "Genre" : "MODE"} value={isStory ? formatGenre(genre ?? "mystery") : "QUEST"} isStory={isStory} />
        </div>

        {/* Highlights */}
        <div className="flex flex-col gap-2">
          {highlights.slice(0, 3).map((h, i) => (
            <div key={i} className={cn("flex items-center gap-3 px-3 py-2 rounded-xl", isStory ? "glass-story" : "glass-quest")}>
              <span className="text-lg shrink-0">⚡</span>
              <p className={cn("text-xs font-medium truncate", isStory ? "text-[#f0d898]" : "text-[#00d4ff]")}>{h}</p>
            </div>
          ))}
        </div>

        {/* Watermark */}
        <p className={cn("text-[10px] text-center opacity-40", isStory ? "font-display" : "font-mono-dm")}>
          {isStory ? "◆ MAIN CHARACTER MODE ◆" : "[ MAIN CHARACTER MODE ]"}
        </p>
      </div>
    </div>
  );
}

function StatChip({ label, value, isStory }: { label: string; value: string; isStory: boolean }) {
  return (
    <div className={cn("flex flex-col items-center py-2 px-1 rounded-xl", isStory ? "glass-story" : "glass-quest")}>
      <span className={cn("text-sm font-bold", isStory ? "font-display text-[#c89b3c]" : "font-mono-dm text-[#00d4ff]")}>{value}</span>
      <span className="text-[9px] text-white/40 tracking-wide mt-0.5">{label}</span>
    </div>
  );
}

function PosterPlaceholder({ mode, genre }: { mode: ActiveMode; genre?: StoryGenre }) {
  const isStory = mode === "story";
  return (
    <div className={cn("absolute inset-0 flex items-center justify-center", isStory ? "bg-story-gradient" : "bg-quest-gradient")}>
      <div className="text-center opacity-30">
        <p className="text-7xl mb-3">{isStory ? "🎭" : "⚡"}</p>
        <p className={cn("text-xs tracking-widest uppercase", isStory ? "font-display text-[#c89b3c]" : "font-mono-dm text-[#00d4ff]")}>
          {isStory ? formatGenre(genre ?? "mystery") : "Campaign"}
        </p>
      </div>
    </div>
  );
}

function formatGenre(genre: StoryGenre): string {
  return genre.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
