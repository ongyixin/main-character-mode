"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/cn";
import { TRACK_METADATA } from "@/lib/shared/lyria";
import type { MusicMood, ActiveMode } from "@/types";

export interface MusicIndicatorState {
  mood: MusicMood;
  intensity: number;
  trackUrl?: string | null;
  trackLabel?: string;
  isFallback?: boolean;
}

interface MusicIndicatorProps {
  state: MusicIndicatorState;
  mode: ActiveMode;
  enableAudio?: boolean;
  className?: string;
}

const BAR_HEIGHTS = [0.45, 0.70, 1.00, 0.80, 0.55, 0.90, 0.65, 0.40, 0.75];

function useMusicAudio(
  trackUrl: string | null | undefined,
  intensity: number,
  enabled: boolean
) {
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const activeFadeRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const outFadeRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = (ref: React.MutableRefObject<ReturnType<typeof setInterval> | null>) => {
    if (ref.current) { clearInterval(ref.current); ref.current = null; }
  };

  const fadeAudio = useCallback(
    (
      el: HTMLAudioElement,
      targetVol: number,
      durationMs: number,
      timerRef: React.MutableRefObject<ReturnType<typeof setInterval> | null>,
      onDone?: () => void
    ) => {
      clearTimer(timerRef);
      const startVol = el.volume;
      const steps = 20;
      const stepMs = durationMs / steps;
      const delta = (targetVol - startVol) / steps;
      let step = 0;

      timerRef.current = setInterval(() => {
        step++;
        el.volume = Math.min(1, Math.max(0, startVol + delta * step));
        if (step >= steps) {
          el.volume = targetVol;
          clearTimer(timerRef);
          if (targetVol === 0) { el.pause(); el.src = ""; }
          onDone?.();
        }
      }, stepMs);
    },
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  useEffect(() => {
    if (!enabled || !trackUrl) return;
    const prevAudio = activeAudioRef.current;
    const nextAudio = new Audio(trackUrl);
    nextAudio.loop = true;
    nextAudio.volume = 0;
    activeAudioRef.current = nextAudio;

    const startNext = () => {
      nextAudio.play().then(() => {
        fadeAudio(nextAudio, Math.min(0.75, intensity), 1000, activeFadeRef);
      }).catch(() => {});
    };

    if (prevAudio && !prevAudio.paused) {
      // Fade out the old track fully, then start the new one
      clearTimer(activeFadeRef);
      fadeAudio(prevAudio, 0, 800, outFadeRef, startNext);
    } else {
      startNext();
    }

    return () => {
      clearTimer(activeFadeRef);
      clearTimer(outFadeRef);
      fadeAudio(nextAudio, 0, 600, outFadeRef);
    };
  }, [trackUrl, enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!enabled || !activeAudioRef.current) return;
    fadeAudio(activeAudioRef.current, Math.min(0.75, intensity), 600, activeFadeRef);
  }, [intensity, enabled, fadeAudio]);
}

export function MusicIndicator({ state, mode, enableAudio = false, className }: MusicIndicatorProps) {
  const [expanded, setExpanded] = useState(false);
  const meta = TRACK_METADATA[state.mood] ?? TRACK_METADATA.ambient;
  const isStory = mode === "story";

  const accentColor = isStory ? "#FFDE00" : "#FFDE00";
  const borderColor = isStory ? "#CC0000" : "#3B4CCA";
  const bgColor = isStory ? "rgba(30,6,6,0.95)" : "rgba(6,8,30,0.95)";
  const shadowColor = isStory ? "rgba(204,0,0,0.5)" : "rgba(59,76,202,0.5)";

  const barCycleDuration = Math.round((60000 / meta.bpm) * 1.5);
  useMusicAudio(state.trackUrl, state.intensity, enableAudio);

  return (
    <button
      onClick={() => setExpanded((v) => !v)}
      className={cn("flex items-center gap-2 select-none touch-target", className)}
      style={{
        border: `2px solid ${borderColor}`,
        background: bgColor,
        boxShadow: `2px 2px 0 ${shadowColor}`,
        padding: "5px 8px",
        minWidth: expanded ? 180 : 0,
      }}
      aria-label={`Music: ${meta.label}`}
    >
      <span className="text-sm shrink-0">{meta.emoji}</span>

      <div className="flex flex-col gap-0.5 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className="font-pixel text-base tracking-wide uppercase truncate"
            style={{ color: accentColor }}
          >
            {meta.label}
          </span>
          <EqualizerBars intensity={state.intensity} cycleDuration={barCycleDuration} color={accentColor} />
        </div>

        {expanded && (
          <div className="flex flex-col gap-1 mt-0.5 text-left">
            <p className="font-vt text-base opacity-60 leading-tight" style={{ color: accentColor }}>
              {meta.description}
            </p>
            <div className="flex items-center gap-2">
              {/* Segmented intensity bar */}
              <div className="flex-1 flex gap-[1px]">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 h-1.5"
                    style={{
                      border: `1px solid ${i < Math.round(state.intensity * 8) ? accentColor : borderColor + "40"}`,
                      background: i < Math.round(state.intensity * 8) ? accentColor : "transparent",
                    }}
                  />
                ))}
              </div>
              <span className="font-pixel text-base shrink-0 tabular-nums" style={{ color: accentColor, opacity: 0.6 }}>
                {meta.bpm}BPM
              </span>
            </div>
            <p className="font-pixel text-base" style={{ color: "rgba(255,255,255,0.2)" }}>
              {enableAudio && state.trackUrl ? "▶ PLAYING" : "◈ NO AUDIO"}
            </p>
          </div>
        )}
      </div>

      {expanded && (
        <span className="font-pixel text-base ml-auto shrink-0 opacity-40" style={{ color: accentColor }}>▲</span>
      )}
    </button>
  );
}

function EqualizerBars({ intensity, cycleDuration, color }: { intensity: number; cycleDuration: number; color: string }) {
  return (
    <div className="flex items-end gap-[1.5px] h-3 shrink-0">
      {BAR_HEIGHTS.map((h, i) => {
        const targetH = Math.max(0.15, h * intensity);
        const delayMs = i * Math.round(cycleDuration / BAR_HEIGHTS.length);
        return (
          <div
            key={i}
            className="w-[2px]"
            style={{
              height: `${targetH * 100}%`,
              minHeight: 2,
              backgroundColor: color,
              opacity: intensity > 0.05 ? 0.6 + h * 0.4 : 0.2,
              animation:
                intensity > 0.05
                  ? `musicBar ${cycleDuration}ms ease-in-out ${delayMs}ms infinite alternate`
                  : "none",
              transition: "height 0.5s ease, opacity 0.5s ease",
            }}
          />
        );
      })}
    </div>
  );
}

export function MusicPill({ state, mode }: { state: MusicIndicatorState; mode: ActiveMode }) {
  const meta = TRACK_METADATA[state.mood] ?? TRACK_METADATA.ambient;
  const isStory = mode === "story";
  const color = isStory ? "#FFDE00" : "#FFDE00";
  const borderColor = isStory ? "#CC0000" : "#3B4CCA";

  return (
    <div
      className="flex items-center gap-1.5 px-2 py-1"
      style={{
        border: `1px solid ${borderColor}`,
        background: isStory ? "rgba(30,6,6,0.9)" : "rgba(6,8,30,0.9)",
      }}
    >
      <span className="text-base">{meta.emoji}</span>
      <span className="font-pixel text-base tracking-wide uppercase" style={{ color }}>
        {meta.label}
      </span>
      <EqualizerBars intensity={state.intensity} cycleDuration={800} color={color} />
    </div>
  );
}
