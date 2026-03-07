"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/cn";
import { RelationshipBar } from "./RelationshipBar";
import type { ObjectCharacter, InteractionMode } from "@/types";

async function fetchSuggestion(
  mode: InteractionMode,
  characterName: string,
  personality: string
): Promise<string | null> {
  try {
    const res = await fetch("/api/suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode, characterName, personality }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.suggestion ?? null;
  } catch {
    return null;
  }
}

interface TalkResult {
  response: string;
  relationshipDelta: number;
  newRelationshipToUser: number;
  emotionalStateUpdate?: string;
}

interface InteractionModalProps {
  character: ObjectCharacter | null;
  onClose: () => void;
  onTalk?: (mode: InteractionMode, message: string) => Promise<TalkResult | null>;
  isLoading?: boolean;
  lastResult?: TalkResult | null;
  isOpen?: boolean;
  onSend?: (character: ObjectCharacter, mode: InteractionMode, message: string) => Promise<void>;
  response?: string;
  relationshipDelta?: number;
}

const INTERACTION_MODES: Array<{
  mode: InteractionMode;
  label: string;
  emoji: string;
  color: string;
  borderColor: string;
}> = [
  { mode: "flirt",       label: "FLIRT",     emoji: "💋", color: "rgba(255,100,100,0.9)", borderColor: "#CC0000" },
  { mode: "interrogate", label: "PROBE",     emoji: "🔍", color: "#B0C4FF",               borderColor: "#3B4CCA" },
  { mode: "recruit",     label: "RECRUIT",   emoji: "🤝", color: "#FFDE00",               borderColor: "#B3A125" },
  { mode: "befriend",    label: "BEFRIEND",  emoji: "💬", color: "#B0C4FF",               borderColor: "#3B4CCA" },
  { mode: "roast",       label: "ROAST",     emoji: "🔥", color: "#FFDE00",               borderColor: "#CC0000" },
  { mode: "apologize",   label: "SORRY",     emoji: "🙏", color: "#B0C4FF",               borderColor: "#3B4CCA" },
];

// ─── Personality → gradient/emoji fallback ───────────────────────────────────

const PORTRAIT_THEMES: { keywords: string[]; gradient: string; emoji: string }[] = [
  { keywords: ["jealous", "envious", "bitter"],    gradient: "from-violet-900 via-purple-800 to-fuchsia-900",  emoji: "😤" },
  { keywords: ["romantic", "longing", "love"],      gradient: "from-rose-900 via-pink-800 to-red-900",           emoji: "🌹" },
  { keywords: ["mysterious", "cryptic", "secret"],  gradient: "from-slate-900 via-zinc-800 to-gray-900",         emoji: "🕯️" },
  { keywords: ["comedic", "chaotic", "clown"],      gradient: "from-amber-900 via-orange-700 to-yellow-800",     emoji: "🎭" },
  { keywords: ["sage", "wise", "oracle"],           gradient: "from-blue-900 via-indigo-800 to-blue-950",        emoji: "🔮" },
  { keywords: ["villain", "dark", "sinister"],      gradient: "from-gray-950 via-red-950 to-black",              emoji: "💀" },
  { keywords: ["hero", "brave", "warrior"],         gradient: "from-amber-800 via-yellow-700 to-orange-800",     emoji: "⚔️" },
  { keywords: ["anxious", "nervous", "worried"],    gradient: "from-teal-900 via-cyan-800 to-green-900",         emoji: "😰" },
  { keywords: ["philosopher", "resigned", "weary"], gradient: "from-stone-900 via-neutral-800 to-slate-900",     emoji: "🧐" },
  { keywords: ["ambitious", "driven", "ruthless"],  gradient: "from-red-900 via-rose-800 to-orange-900",         emoji: "🔱" },
];
const DEFAULT_PORTRAIT_THEME = { gradient: "from-violet-950 via-purple-900 to-indigo-950", emoji: "✦" };

function getPortraitTheme(personality: string) {
  const lower = personality.toLowerCase();
  for (const t of PORTRAIT_THEMES) {
    if (t.keywords.some((k) => lower.includes(k))) return t;
  }
  return DEFAULT_PORTRAIT_THEME;
}

/** Square portrait — compact icon used inside profile panel. */
function CharacterSprite({
  character,
  emotionalState,
}: {
  character: ObjectCharacter;
  emotionalState: string;
}) {
  const { gradient, emoji } = getPortraitTheme(character.personality);
  const initial = character.name.charAt(0).toUpperCase();

  return (
    <div
      className="relative shrink-0 overflow-hidden border border-[#FFDE00]/50"
      style={{ width: 60, height: 60, borderRadius: 5 }}
    >
      {character.portraitUrl ? (
        <img
          src={character.portraitUrl}
          alt={character.name}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className={cn("absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br", gradient)}>
          <span className="text-3xl drop-shadow-lg z-10 leading-none">{emoji}</span>
          <span
            className="absolute bottom-1 right-2 font-display text-white/20 font-black leading-none select-none"
            style={{ fontSize: 20 }}
            aria-hidden
          >
            {initial}
          </span>
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent" />
        </div>
      )}
      {/* Emotional state pip */}
      <div
        className="absolute bottom-1 left-1 w-2 h-2 rounded-full border border-black/30 bg-white/40"
        title={emotionalState}
      />
    </div>
  );
}

/** Large character render shown above the interaction panel. */
function CharacterStageImage({
  character,
}: {
  character: ObjectCharacter;
}) {
  const { gradient, emoji } = getPortraitTheme(character.personality);

  return (
    <div
      className="relative w-full max-w-[320px] sm:max-w-[360px] md:max-w-[420px]"
      style={{ aspectRatio: "3 / 4" }}
    >
      {character.portraitUrl ? (
        <>
          {/* Dark stage backdrop so transparent PNGs pop */}
          <div
            className="absolute inset-0 rounded-xl"
            style={{ background: "radial-gradient(ellipse at 50% 90%, rgba(204,0,0,0.18) 0%, rgba(6,4,14,0) 70%)" }}
          />
          <img
            src={character.portraitUrl}
            alt={character.name}
            className="absolute inset-0 w-full h-full object-contain"
            style={{
              // multiply blends white areas into the dark background, removing any non-transparent white fill
              mixBlendMode: "multiply",
              filter: "drop-shadow(0 8px 24px rgba(255,222,0,0.18)) drop-shadow(0 2px 8px rgba(0,0,0,0.8))",
            }}
          />
          {/* Ground glow beneath feet */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[rgba(204,0,0,0.22)] to-transparent pointer-events-none rounded-b-xl" />
        </>
      ) : (
        <div className={cn("absolute inset-0 flex items-center justify-center rounded-xl bg-gradient-to-b", gradient)}>
          <span className="text-7xl sm:text-8xl drop-shadow-xl leading-none">{emoji}</span>
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent pointer-events-none rounded-b-xl" />
        </div>
      )}
    </div>
  );
}

function TypewriterText({ text, className }: { text: string; className?: string }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    let i = 0;
    const timer = setInterval(() => {
      setDisplayed(text.slice(0, i + 1));
      i++;
      if (i >= text.length) {
        clearInterval(timer);
        setDone(true);
      }
    }, 20);
    return () => clearInterval(timer);
  }, [text]);

  return (
    <p className={className}>
      {displayed}
      {!done && <span className="animate-blink" style={{ color: "#FFDE00" }}>▮</span>}
    </p>
  );
}

export function InteractionModal({
  character,
  onClose,
  onTalk,
  isLoading = false,
  lastResult,
  isOpen = true,
  onSend,
  response: externalResponse,
  relationshipDelta: externalDelta,
}: InteractionModalProps) {
  if (!character || !isOpen) return null;

  const resolvedOnTalk: (mode: InteractionMode, message: string) => Promise<TalkResult | null> =
    onTalk ?? (async (mode, message) => {
      if (onSend) await onSend(character, mode, message);
      return null;
    });

  const resolvedLastResult: TalkResult | null = lastResult ??
    (externalResponse ? {
      response: externalResponse,
      relationshipDelta: externalDelta ?? 0,
      newRelationshipToUser: character.relationshipToUser + (externalDelta ?? 0),
    } : null);

  const [selectedMode, setSelectedMode] = useState<InteractionMode>("befriend");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [suggestingMessage, setSuggestingMessage] = useState(false);
  const [localResult, setLocalResult] = useState<TalkResult | null>(resolvedLastResult ?? null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (!isLoading && lastResult) setLocalResult(lastResult);
  }, [lastResult, isLoading]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    let cancelled = false;
    setSuggestingMessage(true);
    fetchSuggestion(selectedMode, character.name, character.personality).then((s) => {
      if (!cancelled && s) setMessage(s);
      setSuggestingMessage(false);
    });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMode]);

  async function handleSend() {
    const trimmed = message.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try {
      const result = await resolvedOnTalk?.(selectedMode, trimmed) ?? null;
      if (result) setLocalResult(result);
      setMessage("");
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const displayScore = localResult?.newRelationshipToUser ?? character.relationshipToUser;
  const displayEmotion = localResult?.emotionalStateUpdate ?? character.emotionalState;
  const modeConfig = INTERACTION_MODES.find((m) => m.mode === selectedMode)!;

  return (
    <motion.div
      className="absolute inset-0 z-[40] flex flex-col justify-end"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        onClick={onClose}
        style={{ background: "rgba(0,0,0,0.72)" }}
      />

      {/* Modal — RPG dialogue box */}
      <motion.div
        className="relative z-10 h-[88vh] max-h-[88vh] flex flex-col gap-2 px-3 pt-0 pb-4 safe-bottom"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 340 }}
      >
        {/* Character stage image */}
        <div className="flex-1 min-h-[220px] flex items-end justify-center px-1 pb-1 pointer-events-none">
          <CharacterStageImage character={character} />
        </div>

        {/* Window chrome header */}
        <div
          className="shrink-0 max-h-[42vh] overflow-y-auto"
          style={{
            border: "2px solid #FFDE00",
            boxShadow: "3px 3px 0 rgba(204,0,0,0.6)",
          }}
        >
          {/* Title bar */}
          <div
            className="flex items-center justify-between px-2 py-1"
            style={{
              background: "#CC0000",
              borderBottom: "2px solid #FFDE00",
            }}
          >
            <div className="flex items-center gap-1.5">
              <span className="font-pixel text-xs" style={{ color: "#FFDE00" }}>
                ▸ TALKING TO: {character.name.toUpperCase()}
              </span>
            </div>
            <button
              onClick={onClose}
              className="font-pixel text-xs px-1.5 py-0 touch-target"
              style={{ border: "1px solid rgba(255,222,0,0.4)", color: "#FFDE00", background: "rgba(0,0,0,0.3)" }}
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {/* Panel body */}
          <div
            className="flex flex-col gap-2 p-2"
            style={{ background: "rgba(30,6,6,0.98)" }}
          >
            {/* Character portrait + info */}
            <div className="flex items-start gap-2">
              <CharacterSprite character={character} emotionalState={displayEmotion} />
              <div className="flex-1 min-w-0">
                <p className="font-pixel text-xs" style={{ color: "#FFF0B0" }}>
                  {character.name}
                </p>
                <p className="font-vt text-base mt-0" style={{ color: "rgba(255,255,255,0.45)" }}>
                  {character.personality} · <span className="italic">{displayEmotion}</span>
                </p>
              </div>
            </div>

            {/* Relationship meter */}
            <RelationshipBar
              score={displayScore}
              delta={localResult?.relationshipDelta}
              compact
              className="w-full"
            />

            {/* Dialogue box */}
            <div
              style={{
                border: "2px solid rgba(204,0,0,0.6)",
                background: "rgba(6,4,14,0.95)",
                minHeight: 48,
                padding: "6px 10px",
              }}
            >
              <AnimatePresence mode="wait">
                {sending || isLoading ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="w-1.5 h-1.5"
                          style={{ background: "#FFDE00" }}
                          animate={{ opacity: [0.2, 1, 0.2] }}
                          transition={{ duration: 0.8, delay: i * 0.2, repeat: Infinity }}
                        />
                      ))}
                    </div>
                    <span className="font-vt text-sm italic" style={{ color: "rgba(255,255,255,0.4)" }}>
                      {character.name} is considering...
                    </span>
                  </motion.div>
                ) : localResult ? (
                  <motion.div key={localResult.response} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <p className="font-vt text-sm italic leading-snug" style={{ color: "#FFF0B0" }}>
                      <TypewriterText text={`"${localResult.response}"`} />
                    </p>
                  </motion.div>
                ) : (
                  <motion.p
                    key="prompt"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="font-vt text-xs italic"
                    style={{ color: "rgba(255,255,255,0.25)" }}
                  >
                    ▸ Choose how to approach {character.name}...
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Mode picker */}
            <div className="grid grid-cols-3 gap-1">
              {INTERACTION_MODES.map((m) => (
                <button
                  key={m.mode}
                  onClick={() => setSelectedMode(m.mode)}
                  className="touch-target flex flex-col items-center gap-0 transition-all duration-100"
                  style={{
                    padding: "3px 2px",
                    border: `2px solid ${selectedMode === m.mode ? m.color : m.borderColor + "60"}`,
                    background: selectedMode === m.mode ? `rgba(${hexToRgb(m.color)}, 0.15)` : "transparent",
                    boxShadow: selectedMode === m.mode ? `2px 2px 0 ${m.borderColor}60` : "none",
                    transform: selectedMode === m.mode ? "translate(-1px,-1px)" : "none",
                  }}
                >
                  <span className="text-base leading-none">{m.emoji}</span>
                  <span className="font-pixel text-[10px]" style={{ color: selectedMode === m.mode ? m.color : "rgba(255,255,255,0.35)" }}>
                    {m.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Mode hint */}
            <p className="text-center font-pixel text-[10px]" style={{ color: "rgba(255,255,255,0.2)" }}>
              {modeConfig.emoji} APPROACH: {modeConfig.label}
            </p>

            {/* Input row */}
            <div className="flex gap-1.5 items-stretch">
              <input
                ref={inputRef}
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={suggestingMessage ? "Generating suggestion..." : `Say to ${character.name}...`}
                disabled={sending || suggestingMessage}
                className="flex-1 font-vt text-sm px-2 py-1.5 outline-none disabled:opacity-50"
                style={{
                  background: "rgba(6,4,14,0.9)",
                  border: `2px solid ${suggestingMessage ? "rgba(255,222,0,0.4)" : "rgba(204,0,0,0.5)"}`,
                  color: "#FFF0B0",
                  transition: "border-color 0.2s",
                }}
                maxLength={200}
                autoComplete="off"
              />
              <motion.button
                onClick={handleSend}
                disabled={!message.trim() || sending || suggestingMessage}
                className="font-pixel text-xs px-2 disabled:opacity-30"
                style={{
                  background: message.trim() && !sending ? "#CC0000" : "rgba(204,0,0,0.2)",
                  border: "2px solid #FFDE00",
                  color: "#FFDE00",
                  boxShadow: message.trim() && !sending ? "2px 2px 0 rgba(255,222,0,0.3)" : "none",
                  minWidth: 36,
                }}
                whileTap={{ scale: 0.92 }}
                aria-label="Send"
              >
                ▶
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function hexToRgb(hex: string): string {
  if (hex.startsWith("rgba(") || hex.startsWith("rgb(")) {
    const match = hex.match(/\d+/g);
    if (match && match.length >= 3) return `${match[0]}, ${match[1]}, ${match[2]}`;
  }
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}

export default InteractionModal;
