"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/cn";
import { RelationshipBar } from "./RelationshipBar";
import type { ObjectCharacter, InteractionMode } from "@/types";

interface TalkResult {
  response: string;
  relationshipDelta: number;
  newRelationshipToUser: number;
  emotionalStateUpdate?: string;
}

interface InteractionModalProps {
  character: ObjectCharacter | null;
  // Original API
  onClose: () => void;
  onTalk?: (mode: InteractionMode, message: string) => Promise<TalkResult | null>;
  isLoading?: boolean;
  lastResult?: TalkResult | null;
  // Extended API (story/page.tsx compat)
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
  bg: string;
  hint: string;
}> = [
  {
    mode: "flirt",
    label: "Flirt",
    emoji: "💋",
    color: "text-rose-300",
    bg: "bg-rose-500/15 border-rose-500/30 hover:bg-rose-500/25",
    hint: "Romantic tension",
  },
  {
    mode: "interrogate",
    label: "Interrogate",
    emoji: "🔍",
    color: "text-cyan-300",
    bg: "bg-cyan-500/15 border-cyan-500/30 hover:bg-cyan-500/25",
    hint: "Press for secrets",
  },
  {
    mode: "recruit",
    label: "Recruit",
    emoji: "🤝",
    color: "text-amber-300",
    bg: "bg-amber-500/15 border-amber-500/30 hover:bg-amber-500/25",
    hint: "Seek alliance",
  },
  {
    mode: "befriend",
    label: "Befriend",
    emoji: "💬",
    color: "text-emerald-300",
    bg: "bg-emerald-500/15 border-emerald-500/30 hover:bg-emerald-500/25",
    hint: "Build connection",
  },
  {
    mode: "roast",
    label: "Roast",
    emoji: "🔥",
    color: "text-orange-300",
    bg: "bg-orange-500/15 border-orange-500/30 hover:bg-orange-500/25",
    hint: "Mock mercilessly",
  },
  {
    mode: "apologize",
    label: "Apologize",
    emoji: "🙏",
    color: "text-violet-300",
    bg: "bg-violet-500/15 border-violet-500/30 hover:bg-violet-500/25",
    hint: "Seek forgiveness",
  },
];

function TypewriterText({ text, className }: { text: string; className?: string }) {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    setDisplayed("");
    let i = 0;
    const timer = setInterval(() => {
      setDisplayed(text.slice(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(timer);
    }, 22);
    return () => clearInterval(timer);
  }, [text]);

  return <p className={className}>{displayed}</p>;
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

  // Build a unified onTalk handler bridging both APIs
  const resolvedOnTalk: (mode: InteractionMode, message: string) => Promise<TalkResult | null> =
    onTalk ?? (async (mode, message) => {
      if (onSend) await onSend(character, mode, message);
      return null;
    });

  // Inject external response into lastResult shape
  const resolvedLastResult: TalkResult | null = lastResult ??
    (externalResponse ? {
      response: externalResponse,
      relationshipDelta: externalDelta ?? 0,
      newRelationshipToUser: character.relationshipToUser + (externalDelta ?? 0),
    } : null);
  const [selectedMode, setSelectedMode] = useState<InteractionMode>("befriend");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [localResult, setLocalResult] = useState<TalkResult | null>(resolvedLastResult ?? null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync external loading state
  useEffect(() => {
    if (!isLoading && lastResult) {
      setLocalResult(lastResult);
    }
  }, [lastResult, isLoading]);

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
      <div className="absolute inset-0 overlay-dim" onClick={onClose} />

      {/* Modal panel */}
      <motion.div
        className="relative z-10 glass-story rounded-t-3xl px-5 pt-5 pb-8 safe-bottom max-h-[80vh] flex flex-col gap-4"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 320 }}
      >
        {/* Handle bar */}
        <div className="w-12 h-1 rounded-full bg-white/20 mx-auto -mt-1 mb-1" />

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-display text-[#f0d898] text-xl font-bold tracking-wide text-glow-story">
              {character.name}
            </h2>
            <p className="font-body text-white/50 text-xs mt-0.5">
              {character.personality} · <span className="italic">{displayEmotion}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="touch-target text-white/40 hover:text-white/80 transition-colors text-lg"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Relationship bar */}
        <RelationshipBar
          score={displayScore}
          delta={localResult?.relationshipDelta}
          compact
          className="w-full"
        />

        {/* Character response area */}
        <div className="min-h-[60px] bg-white/5 rounded-xl px-4 py-3 border border-white/10">
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
                      className="w-1.5 h-1.5 rounded-full bg-[#c89b3c]"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, delay: i * 0.2, repeat: Infinity }}
                    />
                  ))}
                </div>
                <span className="font-body text-white/40 text-sm italic">
                  {character.name} is considering…
                </span>
              </motion.div>
            ) : localResult ? (
              <motion.div
                key={localResult.response}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <TypewriterText
                  text={`"${localResult.response}"`}
                  className="font-display text-[#f0d898] text-sm leading-relaxed italic"
                />
              </motion.div>
            ) : (
              <motion.p
                key="prompt"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-body text-white/30 text-sm italic"
              >
                Choose how to approach {character.name}…
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Mode picker */}
        <div className="grid grid-cols-3 gap-2">
          {INTERACTION_MODES.map((m) => (
            <button
              key={m.mode}
              onClick={() => setSelectedMode(m.mode)}
              className={cn(
                "touch-target flex flex-col items-center gap-0.5 rounded-xl border px-2 py-2 transition-all duration-150",
                m.bg,
                selectedMode === m.mode
                  ? "opacity-100 scale-105 shadow-lg"
                  : "opacity-60 hover:opacity-80"
              )}
              aria-pressed={selectedMode === m.mode}
            >
              <span className="text-lg leading-none">{m.emoji}</span>
              <span className={cn("font-mono-dm text-[10px] tracking-wide font-semibold", m.color)}>
                {m.label}
              </span>
            </button>
          ))}
        </div>

        {/* Input row */}
        <div className="flex gap-2 items-center">
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Say something to ${character.name}…`}
            disabled={sending}
            className={cn(
              "flex-1 bg-white/8 border border-white/15 rounded-xl",
              "px-4 py-3 font-body text-sm text-white placeholder-white/30",
              "focus:outline-none focus:border-[#c89b3c]/50 focus:ring-1 focus:ring-[#c89b3c]/25",
              "transition-all disabled:opacity-50"
            )}
            maxLength={200}
            autoComplete="off"
          />
          <motion.button
            onClick={handleSend}
            disabled={!message.trim() || sending}
            className={cn(
              "touch-target w-12 h-12 rounded-xl flex items-center justify-center",
              "bg-gradient-to-br from-[#7b3fc4] to-[#c89b3c]",
              "transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            )}
            whileTap={{ scale: 0.9 }}
            aria-label="Send"
          >
            <span className="text-white text-lg">→</span>
          </motion.button>
        </div>

        {/* Mode hint */}
        <p className="text-center font-body text-white/30 text-xs -mt-2">
          {modeConfig.emoji} {modeConfig.hint}
        </p>
      </motion.div>
    </motion.div>
  );
}

export default InteractionModal;
