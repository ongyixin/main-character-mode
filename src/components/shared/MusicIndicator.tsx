"use client";

/**
 * MusicIndicator — floating adaptive soundtrack HUD.
 *
 * Features:
 *  - Collapsed pill: emoji + mood label + animated equalizer bars
 *  - Expanded card: full metadata, intensity meter, BPM, description
 *  - Web Audio crossfade when a real trackUrl is provided
 *  - Visual-only mode (still looks great) when no audio URL is available
 *  - Mode-aware: story (amber/gold) vs quest (cyan/blue)
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/cn";
import { TRACK_METADATA } from "@/lib/shared/lyria";
import type { MusicMood, ActiveMode } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MusicIndicatorState {
  mood: MusicMood;
  intensity: number; // 0–1
  trackUrl?: string | null;
  trackLabel?: string;
  isFallback?: boolean;
}

interface MusicIndicatorProps {
  state: MusicIndicatorState;
  mode: ActiveMode;
  /** Enable actual audio playback (requires user gesture first) */
  enableAudio?: boolean;
  className?: string;
}

// ─── Equalizer bar heights (normalized, will be scaled by intensity) ─────────
const BAR_HEIGHTS = [0.45, 0.70, 1.00, 0.80, 0.55, 0.90, 0.65, 0.40, 0.75];

// ─── Web Audio crossfade hook ─────────────────────────────────────────────────

function useMusicAudio(
  trackUrl: string | null | undefined,
  intensity: number,
  enabled: boolean
) {
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const fadingAudioRef = useRef<HTMLAudioElement | null>(null);
  const fadeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearFadeTimer = () => {
    if (fadeTimerRef.current) {
      clearInterval(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }
  };

  const rampVolume = useCallback(
    (el: HTMLAudioElement, targetVol: number, durationMs: number) => {
      clearFadeTimer();
      const startVol = el.volume;
      const steps = 20;
      const stepMs = durationMs / steps;
      const delta = (targetVol - startVol) / steps;
      let step = 0;

      fadeTimerRef.current = setInterval(() => {
        step++;
        el.volume = Math.min(1, Math.max(0, startVol + delta * step));
        if (step >= steps) {
          el.volume = targetVol;
          clearFadeTimer();
          if (targetVol === 0) {
            el.pause();
            el.src = "";
          }
        }
      }, stepMs);
    },
    []
  );

  useEffect(() => {
    if (!enabled || !trackUrl) return;

    const prevAudio = activeAudioRef.current;

    // Start new audio at vol 0 and fade in
    const nextAudio = new Audio(trackUrl);
    nextAudio.loop = true;
    nextAudio.volume = 0;
    activeAudioRef.current = nextAudio;

    // Fade out previous
    if (prevAudio && !prevAudio.paused) {
      fadingAudioRef.current = prevAudio;
      rampVolume(prevAudio, 0, 1500);
    }

    nextAudio.play().then(() => {
      rampVolume(nextAudio, Math.min(0.75, intensity), 1500);
    }).catch(() => {
      // Autoplay blocked — user must interact first; graceful no-op
    });

    return () => {
      clearFadeTimer();
      rampVolume(nextAudio, 0, 800);
    };
  }, [trackUrl, enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  // Adjust volume when intensity changes (without a full track swap)
  useEffect(() => {
    if (!enabled || !activeAudioRef.current) return;
    rampVolume(activeAudioRef.current, Math.min(0.75, intensity), 600);
  }, [intensity, enabled, rampVolume]);
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MusicIndicator({
  state,
  mode,
  enableAudio = false,
  className,
}: MusicIndicatorProps) {
  const [expanded, setExpanded] = useState(false);
  const meta = TRACK_METADATA[state.mood] ?? TRACK_METADATA.ambient;
  const isStory = mode === "story";

  // Color tokens
  const accent = isStory ? "#c89b3c" : "#00d4ff";
  const accentDim = isStory ? "rgba(200,155,60,0.15)" : "rgba(0,212,255,0.12)";
  const borderColor = isStory ? "rgba(200,155,60,0.3)" : "rgba(0,212,255,0.25)";
  const glowColor = isStory
    ? "0 0 16px rgba(200,155,60,0.2)"
    : "0 0 16px rgba(0,212,255,0.2)";

  // Animate equalizer bars at a rate derived from BPM
  const barCycleDuration = Math.round((60000 / meta.bpm) * 1.5); // 1.5 beat periods

  useMusicAudio(state.trackUrl, state.intensity, enableAudio);

  return (
    <button
      onClick={() => setExpanded((v) => !v)}
      className={cn(
        "relative flex items-center gap-2 rounded-2xl px-3 py-2 transition-all duration-300",
        "border backdrop-blur-xl select-none touch-target",
        className
      )}
      style={{
        background: accentDim,
        borderColor,
        boxShadow: glowColor,
        minWidth: expanded ? 220 : 0,
      }}
      aria-label={`Music: ${meta.label}`}
    >
      {/* ── Emoji icon ────────────────────────────────────────────────────── */}
      <span className="text-base shrink-0">{meta.emoji}</span>

      {/* ── Label + equalizer ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-0.5 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className="font-mono-dm text-[10px] tracking-[0.12em] uppercase truncate"
            style={{ color: accent }}
          >
            {meta.label}
          </span>

          {/* Equalizer bars */}
          <EqualizerBars
            intensity={state.intensity}
            cycleDuration={barCycleDuration}
            color={accent}
          />
        </div>

        {/* Expanded: description + stats */}
        {expanded && (
          <div className="flex flex-col gap-1 mt-1 text-left">
            <p
              className="font-mono-dm text-[9px] opacity-60 leading-tight"
              style={{ color: accent }}
            >
              {meta.description}
            </p>
            <div className="flex items-center gap-2">
              {/* Intensity bar */}
              <div className="flex-1 h-[3px] rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${state.intensity * 100}%`,
                    background: `linear-gradient(90deg, ${accent}88, ${accent})`,
                  }}
                />
              </div>
              <span
                className="font-mono-dm text-[9px] shrink-0 tabular-nums"
                style={{ color: accent, opacity: 0.6 }}
              >
                {meta.bpm} BPM
              </span>
            </div>
            {state.isFallback !== false && (
              <p className="font-mono-dm text-[8px] text-white/25 tracking-widest">
                {enableAudio && state.trackUrl ? "▶ PLAYING" : "◈ NO AUDIO"}
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── Collapse chevron (expanded only) ─────────────────────────────── */}
      {expanded && (
        <span className="text-[10px] ml-auto shrink-0 opacity-40">▲</span>
      )}
    </button>
  );
}

// ─── Equalizer Bars sub-component ─────────────────────────────────────────────

function EqualizerBars({
  intensity,
  cycleDuration,
  color,
}: {
  intensity: number;
  cycleDuration: number;
  color: string;
}) {
  return (
    <div className="flex items-end gap-[1.5px] h-3.5 shrink-0">
      {BAR_HEIGHTS.map((h, i) => {
        const targetH = Math.max(0.15, h * intensity);
        const delayMs = i * Math.round(cycleDuration / BAR_HEIGHTS.length);
        return (
          <div
            key={i}
            className="w-[2px] rounded-full"
            style={{
              height: `${targetH * 100}%`,
              minHeight: 2,
              backgroundColor: color,
              opacity: intensity > 0.05 ? 0.7 + h * 0.3 : 0.25,
              animation:
                intensity > 0.05
                  ? `musicBar ${cycleDuration}ms ease-in-out ${delayMs}ms infinite alternate`
                  : "none",
              transition: "height 0.6s ease, opacity 0.6s ease",
            }}
          />
        );
      })}
    </div>
  );
}

// ─── Compact version for always-on HUD ────────────────────────────────────────

export function MusicPill({
  state,
  mode,
}: {
  state: MusicIndicatorState;
  mode: ActiveMode;
}) {
  const meta = TRACK_METADATA[state.mood] ?? TRACK_METADATA.ambient;
  const accent = mode === "story" ? "#c89b3c" : "#00d4ff";

  return (
    <div
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
      style={{
        background: mode === "story"
          ? "rgba(200,155,60,0.1)"
          : "rgba(0,212,255,0.1)",
        border: `1px solid ${mode === "story" ? "rgba(200,155,60,0.2)" : "rgba(0,212,255,0.18)"}`,
      }}
    >
      <span className="text-xs">{meta.emoji}</span>
      <span
        className="font-mono-dm text-[9px] tracking-widest uppercase"
        style={{ color: accent }}
      >
        {meta.label}
      </span>
      <EqualizerBars intensity={state.intensity} cycleDuration={800} color={accent} />
    </div>
  );
}
