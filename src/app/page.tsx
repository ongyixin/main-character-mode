"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import type { StoryGenre } from "@/types";
import {
  TabBar,
  NewsTicker,
  HowToPlay,
  AboutPanel,
  CommunityPanel,
  SettingsPanel,
  QuickStats,
  TwinklingStars,
  PixelCharacter,
} from "@/components/landing";
import type { TabId, Settings } from "@/components/landing";

// ─── Utilities ────────────────────────────────────────────────────────────────

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}

// ─── Scene data ───────────────────────────────────────────────────────────────

// [x%, bottom%, delay(s), isGreen]
const FIREFLIES: readonly [number, number, number, boolean][] = [
  [12, 14, 0, false], [23, 10, 1.5, true], [35, 17, 0.8, false],
  [48, 12, 2.3, false], [61, 15, 0.3, true], [74, 11, 1.8, false],
  [87, 16, 1.1, true], [7, 9, 2.8, false],
  // Extra fireflies for density
  [16, 13, 0.6, true], [42, 10, 1.9, false], [56, 16, 0.4, true],
  [71, 12, 2.6, false], [82, 9, 1.2, true],
];

// ─── Genre config ─────────────────────────────────────────────────────────────

const GENRES = [
  { value: "mystery" as StoryGenre, label: "MYSTERY", emoji: "🔍", tagline: "Every object hides a secret", color: "#B0C4FF", borderColor: "#3B4CCA", shadowColor: "rgba(59,76,202,0.6)" },
  { value: "soap_opera" as StoryGenre, label: "SOAP OPERA", emoji: "🌹", tagline: "Everyone is betrayed. Always.", color: "rgba(255,100,100,0.9)", borderColor: "#CC0000", shadowColor: "rgba(204,0,0,0.6)" },
  { value: "workplace_drama" as StoryGenre, label: "WORK DRAMA", emoji: "💼", tagline: "Your lamp is now HR", color: "#FFDE00", borderColor: "#B3A125", shadowColor: "rgba(179,161,37,0.6)" },
  { value: "dating_sim" as StoryGenre, label: "DATING SIM", emoji: "💘", tagline: "Romance your furniture", color: "rgba(255,100,100,0.9)", borderColor: "#CC0000", shadowColor: "rgba(204,0,0,0.6)" },
  { value: "fantasy" as StoryGenre, label: "FANTASY", emoji: "⚔️", tagline: "Ancient power stirs in the mundane", color: "#B0C4FF", borderColor: "#3B4CCA", shadowColor: "rgba(59,76,202,0.6)" },
  { value: "survival" as StoryGenre, label: "SURVIVAL", emoji: "🪓", tagline: "Trust no one. Esp. the fridge.", color: "rgba(255,100,100,0.9)", borderColor: "#CC0000", shadowColor: "rgba(204,0,0,0.6)" },
];

// ─── Reusable retro UI primitives ─────────────────────────────────────────────

function CornerBrackets({
  color = "#FFDE00",
  size = 10,
  thickness = 2,
}: {
  color?: string;
  size?: number;
  thickness?: number;
}) {
  const corners: { top?: number; bottom?: number; left?: number; right?: number }[] = [
    { top: 0, left: 0 },
    { top: 0, right: 0 },
    { bottom: 0, left: 0 },
    { bottom: 0, right: 0 },
  ];

  return (
    <>
      {corners.map((pos, i) => {
        const isTop = i < 2;
        const isLeft = i % 2 === 0;
        return (
          <div key={i} style={{ position: "absolute", ...pos }}>
            <div
              style={{
                position: "absolute",
                background: color,
                width: size,
                height: thickness,
                ...(isTop ? { top: 0 } : { bottom: 0 }),
                ...(isLeft ? { left: 0 } : { right: 0 }),
              }}
            />
            <div
              style={{
                position: "absolute",
                background: color,
                width: thickness,
                height: size,
                ...(isTop ? { top: 0 } : { bottom: 0 }),
                ...(isLeft ? { left: 0 } : { right: 0 }),
              }}
            />
          </div>
        );
      })}
    </>
  );
}

function PixelCursor({ color = "#FFDE00", active = false }: { color?: string; active?: boolean }) {
  return (
    <motion.span
      className="font-pixel inline-block shrink-0"
      style={{ color, fontSize: 16, minWidth: 12 }}
      animate={{ opacity: active ? [1, 0.1, 1] : 0, x: active ? 0 : -4 }}
      transition={
        active
          ? { duration: 0.9, repeat: Infinity, ease: "linear" }
          : { duration: 0.15 }
      }
    >
      ▶
    </motion.span>
  );
}

function PixelDivider({ color = "rgba(255,222,0,0.35)" }: { color?: string }) {
  const opacities = [0.2, 0.45, 0.8, 0.45, 0.2];
  return (
    <div style={{ display: "flex", justifyContent: "center", gap: 4, margin: "10px 0" }}>
      {opacities.map((op, i) => (
        <div
          key={i}
          style={{
            width: 2,
            height: 2,
            background: color.replace(/[\d.]+\)$/, `${op})`),
          }}
        />
      ))}
    </div>
  );
}

// ─── World background scene ────────────────────────────────────────────────────

function PixelBackground({ showFog = true }: { showFog?: boolean }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* ── Background image ── */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "url('/images/pixel_bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center bottom",
          backgroundRepeat: "no-repeat",
        }}
      />

      {/* ── Darkening overlay to keep UI readable ── */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(2,1,17,0.45) 0%, rgba(2,1,17,0.2) 40%, rgba(2,1,17,0.35) 75%, rgba(2,1,17,0.7) 100%)",
        }}
      />

      {/* ── Shooting star 1 ── */}
      <div
        className="absolute"
        style={{
          top: "9%",
          left: 0,
          width: 64,
          height: 1,
          background:
            "linear-gradient(to right, transparent 0%, rgba(255,255,255,0.85) 60%, transparent 100%)",
          animation: "shootingStar 10s 4s linear infinite",
        }}
      />

      {/* ── Shooting star 2 (offset timing) ── */}
      <div
        className="absolute"
        style={{
          top: "18%",
          left: 0,
          width: 48,
          height: 1,
          background:
            "linear-gradient(to right, transparent 0%, rgba(192,132,252,0.7) 60%, transparent 100%)",
          animation: "shootingStar 10s 17s linear infinite",
        }}
      />

      {/* ── Fog / atmosphere layer ── */}
      {showFog && (
        <div
          className="absolute"
          style={{
            bottom: "18%",
            left: "-10%",
            right: "-10%",
            height: "14%",
            background:
              "linear-gradient(to bottom, transparent 0%, rgba(107,33,168,0.06) 40%, rgba(29,78,216,0.04) 70%, transparent 100%)",
            animation: "fogDrift 18s ease-in-out infinite",
          }}
        />
      )}

      {/* ── Fireflies ── */}
      {FIREFLIES.map(([x, bot, delay, isGreen], i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: `${x}%`,
            bottom: `${bot}%`,
            width: 2,
            height: 2,
            borderRadius: "50%",
            background: isGreen ? "rgba(0,255,127,0.9)" : "rgba(255,215,0,0.9)",
            boxShadow: isGreen
              ? "0 0 5px 2px rgba(0,255,127,0.35)"
              : "0 0 5px 2px rgba(255,215,0,0.35)",
            animation: `fireflyFloat ${4.2 + i * 0.35}s ${delay}s ease-in-out infinite`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Title card ───────────────────────────────────────────────────────────────

function TitleCard({ wide = false, onStart }: { wide?: boolean; onStart?: () => void }) {
  return (
    <motion.div
      className={wide ? "w-1/2 mx-auto" : "w-full max-w-lg mx-auto"}
      initial={{ opacity: 0, y: -18, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.12, duration: 0.7, type: "spring", stiffness: 100 }}
    >
      {/* Outer yellow border */}
      <div style={{ padding: wide ? 3 : 4, background: "#FFDE00", position: "relative" }}>
        {/* Red inner ring */}
        <div style={{ padding: wide ? 2 : 3, background: "rgba(204,0,0,0.55)" }}>
          {/* Content box */}
          <div
            style={{
              padding: wide ? "8px 22px 8px" : "28px 32px 24px",
              background: "rgba(5,2,20,0.98)",
              border: "1px solid rgba(255,222,0,0.1)",
              position: "relative",
            }}
          >
            <CornerBrackets color="#FFDE00" size={wide ? 16 : 14} thickness={2} />

            {/* Top meta bar */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: wide ? 5 : 18,
                paddingBottom: wide ? 4 : 14,
                borderBottom: "1px solid rgba(255,222,0,0.1)",
              }}
            >
              <span
                className="font-pixel"
                style={{ fontSize: wide ? 11 : 11, color: "rgba(255,222,0,0.28)", letterSpacing: "0.15em" }}
              >
                VER 1.0
              </span>
              <span
                className="font-pixel"
                style={{ fontSize: wide ? 11 : 11, color: "rgba(255,222,0,0.28)", letterSpacing: "0.1em" }}
              >
                YC × DEEPMIND
              </span>
            </div>

            {/* Animated sparkle row */}
            <div style={{ display: "flex", justifyContent: "center", gap: wide ? 16 : 14, marginBottom: wide ? 5 : 18 }}>
              {(["★", "✦", "★"] as const).map((s, i) => (
                <motion.span
                  key={i}
                  className="font-pixel"
                  style={{ fontSize: wide ? 16 : 14, color: "#FFDE00" }}
                  animate={{ opacity: [0.3, 1, 0.3], scale: [0.9, 1.1, 0.9] }}
                  transition={{ duration: 2.4, delay: i * 0.65, repeat: Infinity, ease: "easeInOut" }}
                >
                  {s}
                </motion.span>
              ))}
            </div>

            {/* Main title hierarchy */}
            <div style={{ textAlign: "center" }}>
              <p
                className="font-pixel"
                style={{
                  fontSize: wide ? 18 : 16,
                  lineHeight: wide ? 1.2 : 2,
                  color: "#FFDE00",
                  letterSpacing: "0.2em",
                  textShadow: "1px 1px 0 rgba(204,0,0,0.9)",
                }}
              >
                MAIN
              </p>
              <motion.p
                className="font-pixel"
                style={{
                  fontSize: wide ? 20 : 18,
                  lineHeight: wide ? 1.2 : 1.9,
                  color: "#FFDE00",
                  letterSpacing: "0.16em",
                }}
                animate={{
                  textShadow: [
                    "0 0 10px rgba(255,222,0,0.3), 2px 2px 0 rgba(30,6,6,0.95)",
                    "0 0 22px rgba(255,222,0,0.7), 2px 2px 0 rgba(30,6,6,0.95)",
                    "0 0 10px rgba(255,222,0,0.3), 2px 2px 0 rgba(30,6,6,0.95)",
                  ],
                }}
                transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
              >
                CHARACTER
              </motion.p>
              <motion.p
                className="font-pixel"
                style={{
                  fontSize: wide ? 26 : 22,
                  lineHeight: wide ? 1.2 : 1.8,
                  color: "#B0C4FF",
                  letterSpacing: "0.12em",
                  marginTop: wide ? 2 : 6,
                }}
                animate={{
                  textShadow: [
                    "0 0 8px rgba(59,76,202,0.4), 3px 3px 0 rgba(6,8,30,0.95)",
                    "0 0 20px rgba(59,76,202,0.75), 3px 3px 0 rgba(6,8,30,0.95)",
                    "0 0 8px rgba(59,76,202,0.4), 3px 3px 0 rgba(6,8,30,0.95)",
                  ],
                }}
                transition={{ duration: 2.6, delay: 0.9, repeat: Infinity, ease: "easeInOut" }}
              >
                MODE
              </motion.p>
            </div>

            <PixelDivider color="rgba(255,222,0,0.5)" />

            {/* Tagline */}
            <div style={{ textAlign: "center", paddingTop: wide ? 0 : 6 }}>
              <p className="font-vt" style={{ fontSize: wide ? 20 : 24, color: "rgba(255,255,255,0.55)", lineHeight: wide ? 1.1 : 1.4 }}>
                Your world is already a game.
              </p>
              <p className="font-vt" style={{ fontSize: wide ? 17 : 22, color: "rgba(255,255,255,0.33)", marginTop: wide ? 0 : 4 }}>
                You just haven&apos;t noticed.
              </p>
            </div>

            {/* Press Start button - only on landing page */}
            {onStart && (
              <motion.div
                onClick={onStart}
                style={{
                  marginTop: 24,
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.35 }}
              >
                {/* Blinking PRESS START */}
                <motion.div
                  animate={{ opacity: [1, 1, 0, 0, 1] }}
                  transition={{ duration: 1.4, times: [0, 0.45, 0.5, 0.95, 1], repeat: Infinity, ease: "linear" }}
                  className="font-pixel"
                  style={{
                    fontSize: 18,
                    letterSpacing: "0.22em",
                    color: "#FFDE00",
                    textShadow: "2px 2px 0 rgba(204,0,0,0.9), 0 0 24px rgba(255,222,0,0.55)",
                  }}
                >
                  PRESS START
                </motion.div>

                <div
                  className="font-vt"
                  style={{ fontSize: 16, color: "rgba(255,255,255,0.28)", marginTop: 12, letterSpacing: "0.04em" }}
                >
                  tap anywhere to begin
                </div>

                {/* Subtle bottom dots indicator */}
                <div style={{ display: "flex", gap: 5, marginTop: 16 }}>
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      style={{ width: 4, height: 4, background: "rgba(255,222,0,0.4)" }}
                      animate={{ opacity: [0.2, 0.9, 0.2] }}
                      transition={{ duration: 1.8, delay: i * 0.3, repeat: Infinity, ease: "easeInOut" }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Mode option row ──────────────────────────────────────────────────────────

function ModeOption({
  active,
  onSelect,
  icon,
  label,
  tagline,
  tooltip,
  color,
  accent,
}: {
  active: boolean;
  onSelect: () => void;
  icon: string;
  label: string;
  tagline: string;
  tooltip: string;
  color: string;
  accent: string;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={onSelect}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setHovered(true)}
        onBlur={() => setHovered(false)}
        className="w-full text-left"
        style={{
          padding: "12px 16px",
          background: active ? accent : "transparent",
          transition: "background 0.15s",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <PixelCursor color={color} active={active} />
          <span style={{ fontSize: 20, lineHeight: 1 }}>{icon}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              className="font-pixel"
              style={{ fontSize: 16, letterSpacing: "0.14em", color, lineHeight: 1.7 }}
            >
              {label}
            </p>
            <p className="font-vt" style={{ fontSize: 16, color: "rgba(255,255,255,0.38)", marginTop: 2 }}>
              {tagline}
            </p>
          </div>
          <AnimatePresence>
            {active && (
              <motion.span
                key="pip"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                className="font-pixel shrink-0"
                style={{ fontSize: 16, color }}
              >
                ◆
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </button>

      <AnimatePresence>
        {hovered && (
          <motion.div
            key="tooltip"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.14 }}
            style={{
              position: "absolute",
              top: "calc(100% + 4px)",
              left: 12,
              right: 12,
              zIndex: 60,
              background: "rgba(4,2,18,0.98)",
              border: `2px solid ${color}`,
              boxShadow: `4px 4px 0 ${color}44`,
              padding: "8px 12px",
              pointerEvents: "none",
            }}
          >
            {/* corner pip */}
            <span
              className="font-pixel"
              style={{
                position: "absolute",
                top: -10,
                left: 14,
                fontSize: 16,
                color,
                lineHeight: 1,
              }}
            >
              ▲
            </span>
            <p className="font-vt" style={{ fontSize: 16, color: "rgba(255,255,255,0.72)", lineHeight: 1.55 }}>
              {tooltip}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Genre card ───────────────────────────────────────────────────────────────

function GenreCard({
  genre,
  onClick,
  disabled,
  delay = 0,
}: {
  genre: (typeof GENRES)[number];
  onClick: () => void;
  disabled: boolean;
  delay?: number;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.button
      onClick={onClick}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      disabled={disabled}
      initial={{ opacity: 0, scale: 0.82 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.25, type: "spring" }}
      whileTap={{ scale: 0.93 }}
      className="w-full text-left disabled:opacity-50"
    >
      <div
        className="border-2 p-3"
        style={{
          borderColor: genre.color,
          boxShadow: hovered ? `3px 3px 0 ${genre.shadowColor}` : `2px 2px 0 ${genre.shadowColor}`,
          background: hovered
            ? `rgba(${hexToRgb(genre.color)}, 0.15)`
            : "rgba(10,6,20,0.95)",
          transition: "background 0.1s, box-shadow 0.05s",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
          {hovered && (
            <span className="font-pixel" style={{ fontSize: 16, color: genre.color }}>▶</span>
          )}
          <span style={{ fontSize: 20 }}>{genre.emoji}</span>
        </div>
        <p
          className="font-pixel tracking-wide leading-relaxed"
          style={{ fontSize: 16, color: genre.color }}
        >
          {genre.label}
        </p>
        <p
          className="font-vt leading-tight mt-1"
          style={{ fontSize: 16, color: "rgba(255,255,255,0.38)" }}
        >
          {genre.tagline}
        </p>
      </div>
    </motion.button>
  );
}

// ─── Play tab — mode select screen ───────────────────────────────────────────

function PlayTabModeSelect({
  activeMode,
  setActiveMode,
  onEnter,
}: {
  activeMode: "story" | "quest";
  setActiveMode: (m: "story" | "quest") => void;
  onEnter: () => void;
}) {
  return (
    <motion.div
      key="mode-select"
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12 }}
      transition={{ duration: 0.22 }}
    >
      {/* Title card */}
      <div className="px-4 pt-4 pb-2">
        <TitleCard wide />
      </div>

      {/* Mode selector + footer — anchored to content bottom */}
      <div className="px-4 pb-2">
        {/* Mode selector panel */}
        <div
          style={{
            border: "2px solid rgba(255,222,0,0.38)",
            boxShadow: "4px 4px 0 rgba(204,0,0,0.38)",
            background: "rgba(5,2,20,0.97)",
          }}
        >
          {/* Panel chrome header */}
          <div
            className="font-pixel px-4 py-2 flex items-center justify-between"
            style={{
              fontSize: 16,
              background: "rgba(204,0,0,0.45)",
              borderBottom: "1px solid rgba(255,222,0,0.18)",
              color: "#FFDE00",
              letterSpacing: "0.2em",
            }}
          >
            <span>▸ SELECT MODE</span>
            <motion.span
              animate={{ opacity: [1, 0.1, 1] }}
              transition={{ duration: 1.4, repeat: Infinity }}
              style={{ color: "#FFDE00", fontSize: 16 }}
            >
              ●
            </motion.span>
          </div>

          <ModeOption
            active={activeMode === "story"}
            onSelect={() => setActiveMode("story")}
            icon="🎭"
            label="STORY MODE"
            tagline="Objects become characters. Drama ensues."
            tooltip="Pick a genre and your surroundings transform into a living narrative. Every object gets a personality, forms relationships, and can issue quests. The AI narrates the drama as it unfolds in real time."
            color="#CC0000"
            accent="rgba(204,0,0,0.1)"
          />

          <div style={{ height: 1, background: "rgba(255,222,0,0.07)", margin: "0 16px" }} />

          <ModeOption
            active={activeMode === "quest"}
            onSelect={() => setActiveMode("quest")}
            icon="⚡"
            label="QUEST MODE"
            tagline="Chores become missions. Life has momentum."
            tooltip="Enter real-world tasks and they become tactical missions. Scan your environment to trigger context-aware objectives. Complete them to earn XP, build combo streaks, and level up."
            color="#3B4CCA"
            accent="rgba(59,76,202,0.1)"
          />
        </div>

        {/* Mode preview text */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeMode}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{
              marginTop: 6,
              padding: "8px 14px",
              border: "1px solid rgba(255,255,255,0.05)",
              background: "rgba(5,2,20,0.8)",
            }}
          >
            <p
              className="font-vt"
              style={{ fontSize: 16, color: "rgba(255,255,255,0.38)", lineHeight: 1.5 }}
            >
              {activeMode === "story"
                ? "Pick a genre → your room becomes a stage. Every object has a role."
                : "Scan your space → tasks become a quest log. Earn XP for real-world missions."}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Quick stats row */}
        <QuickStats />

        {/* Enter button */}
        <motion.button
          onClick={onEnter}
          whileTap={{ scale: 0.97, x: 3, y: 3 }}
          className="w-full mt-2 font-pixel tracking-widest"
          style={{
            fontSize: 16,
            padding: "14px 0",
            background: activeMode === "story" ? "#CC0000" : "#3B4CCA",
            color: "#FFDE00",
            border: `2px solid ${activeMode === "story" ? "#990000" : "#1a2880"}`,
            boxShadow: `4px 4px 0 ${activeMode === "story" ? "rgba(204,0,0,0.7)" : "rgba(59,76,202,0.7)"}`,
            transition: "background 0.22s, border-color 0.22s, box-shadow 0.22s",
          }}
        >
          ▶ ENTER {activeMode === "story" ? "STORY" : "QUEST"}
        </motion.button>

        {/* Footer credit */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          className="font-pixel text-center mt-3"
          style={{ fontSize: 16, letterSpacing: "0.22em", color: "rgba(255,255,255,0.09)" }}
        >
          YC × GOOGLE DEEPMIND HACKATHON
        </motion.p>
      </div>
    </motion.div>
  );
}

// ─── Play tab — genre select screen ──────────────────────────────────────────

function PlayTabGenreSelect({
  onBack,
  onGenreSelect,
  entering,
}: {
  onBack: () => void;
  onGenreSelect: (g: StoryGenre) => void;
  entering: boolean;
}) {
  return (
    <motion.div
      key="genre-select"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.22 }}
    >
      <div className="px-5 pt-4 pb-3">
        <button
          onClick={onBack}
          className="font-pixel mb-4 block"
          style={{ fontSize: 16, letterSpacing: "0.14em", color: "rgba(255,255,255,0.3)" }}
        >
          ← BACK
        </button>

        <div
          className="border-2 mb-3"
          style={{
            borderColor: "#CC0000",
            boxShadow: "3px 3px 0 rgba(204,0,0,0.5)",
          }}
        >
          <div className="pixel-header-story">▸ SELECT GENRE — STORY MODE</div>
          <div className="px-4 py-3" style={{ background: "rgba(30,6,6,0.98)" }}>
            <p className="font-vt" style={{ fontSize: 16, color: "rgba(255,255,255,0.45)" }}>
              Choose how your objects behave.
            </p>
          </div>
        </div>
      </div>

      <div className="px-5 pb-10">
        <div className="grid grid-cols-2 gap-3">
          {GENRES.map((genre, i) => (
            <GenreCard
              key={genre.value}
              genre={genre}
              onClick={() => onGenreSelect(genre.value)}
              disabled={entering}
              delay={i * 0.06}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

type AppScreen = "intro" | "main";
type PlayScreen = "mode_select" | "genre_select";

const DEFAULT_SETTINGS: Settings = { sound: false, crt: true, pixelGrid: true };

export default function HomePage() {
  const router = useRouter();
  const [appScreen, setAppScreen] = useState<AppScreen>("intro");
  const [activeTab, setActiveTab] = useState<TabId>("play");
  const [playScreen, setPlayScreen] = useState<PlayScreen>("mode_select");
  const [activeMode, setActiveMode] = useState<"story" | "quest">("story");
  const [entering, setEntering] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("mcm_settings");
      if (saved) setSettings(JSON.parse(saved));
    } catch { /* silent */ }
  }, []);

  // Persist settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("mcm_settings", JSON.stringify(settings));
    } catch { /* silent */ }
  }, [settings]);

  function handleEnter() {
    if (entering) return;
    if (activeMode === "quest") {
      router.push("/quest");
    } else {
      setPlayScreen("genre_select");
    }
  }

  async function handleGenreSelect(genre: StoryGenre) {
    if (entering) return;
    setEntering(true);
    router.push(`/story?genre=${genre}`);
  }

  // ── Shared background + overlays ───────────────────────────────────────────
  const bgAndOverlays = (
    <>
      <PixelBackground showFog />

      {/* Twinkling pixel art stars across the top */}
      <TwinklingStars />

      {/* Boat sprites sailing across the bay */}
      <PixelCharacter />

      {/* CRT scanlines */}
      {settings.crt && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.06) 3px, rgba(0,0,0,0.06) 4px)",
            zIndex: 5,
          }}
        />
      )}

      {/* CRT vignette */}
      {settings.crt && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 100% 100% at 50% 50%, transparent 55%, rgba(0,0,0,0.55) 100%)",
            zIndex: 5,
          }}
        />
      )}

      {/* Pixel grid */}
      {settings.pixelGrid && (
        <div
          className="absolute inset-0 pointer-events-none pixel-grid"
          style={{ zIndex: 4, opacity: 0.35 }}
        />
      )}
    </>
  );

  // ── INTRO SCREEN ──────────────────────────────────────────────────────────
  if (appScreen === "intro") {
    return (
      <div
        className="relative overflow-hidden"
        style={{ minHeight: "100svh", background: "#020111" }}
      >
        {bgAndOverlays}

        {/* Intro content layer */}
        <AnimatePresence mode="wait">
          <motion.div
            key="intro"
            className="relative flex flex-col"
            style={{ minHeight: "100svh", zIndex: 10 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.35 }}
          >
            {/* Top build label */}
            <motion.div
              className="flex justify-between items-center px-4 shrink-0"
              style={{ paddingTop: "max(12px, env(safe-area-inset-top))" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <span className="font-pixel" style={{ fontSize: 16, color: "rgba(255,222,0,0.2)", letterSpacing: "0.25em" }}>
                BUILD 1.0.0
              </span>
              <span className="font-pixel" style={{ fontSize: 16, color: "rgba(255,222,0,0.2)", letterSpacing: "0.14em" }}>
                ★ HACKATHON DEMO
              </span>
            </motion.div>

            {/* Title card — floats in sky */}
            <div className="flex-1 flex items-center justify-center px-4 py-4">
              <TitleCard onStart={() => setAppScreen("main")} />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // ── MAIN SCREEN (tabbed) ──────────────────────────────────────────────────
  return (
    <div
      className="relative overflow-hidden"
      style={{ minHeight: "100svh", background: "#020111" }}
    >
      {bgAndOverlays}

      {/* Main content layer */}
      <motion.div
        className="relative flex flex-col"
        style={{ minHeight: "100svh", zIndex: 10 }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38, type: "spring", stiffness: 140 }}
      >
        {/* Tab bar */}
        <TabBar
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            // Reset play screen when navigating away and back
            if (tab === "play") setPlayScreen("mode_select");
          }}
          soundEnabled={settings.sound}
          onSoundToggle={() => setSettings((s) => ({ ...s, sound: !s.sound }))}
        />

        {/* Tab content — scrollable, padded for bottom ticker */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            paddingBottom: 50, // space for news ticker
          }}
        >
          {/* Flat keyed AnimatePresence — each screen is a direct motion.div child */}
          <AnimatePresence mode="wait">
            {activeTab === "play" && playScreen === "mode_select" && (
              <PlayTabModeSelect
                key="play-mode"
                activeMode={activeMode}
                setActiveMode={setActiveMode}
                onEnter={handleEnter}
              />
            )}
            {activeTab === "play" && playScreen === "genre_select" && (
              <PlayTabGenreSelect
                key="play-genre"
                onBack={() => setPlayScreen("mode_select")}
                onGenreSelect={handleGenreSelect}
                entering={entering}
              />
            )}
            {activeTab === "howtoplay" && <HowToPlay key="howtoplay" />}
            {activeTab === "about" && <AboutPanel key="about" />}
            {activeTab === "community" && <CommunityPanel key="community" />}
            {activeTab === "settings" && (
              <SettingsPanel
                key="settings"
                settings={settings}
                onSettingsChange={setSettings}
              />
            )}
          </AnimatePresence>
        </div>

        {/* News ticker — fixed at bottom */}
        <NewsTicker />
      </motion.div>
    </div>
  );
}
