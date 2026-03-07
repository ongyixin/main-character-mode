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
  const [localResult, setLocalResult] = useState<TalkResult | null>(resolvedLastResult ?? null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isLoading && lastResult) setLocalResult(lastResult);
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
      <div
        className="absolute inset-0"
        onClick={onClose}
        style={{ background: "rgba(0,0,0,0.72)" }}
      />

      {/* Modal — RPG dialogue box */}
      <motion.div
        className="relative z-10 flex flex-col gap-3 px-3 pt-0 pb-6 safe-bottom max-h-[85vh] overflow-y-auto"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 340 }}
      >
        {/* Window chrome header */}
        <div
          style={{
            border: "2px solid #FFDE00",
            boxShadow: "4px 4px 0 rgba(204,0,0,0.6)",
          }}
        >
          {/* Title bar */}
          <div
            className="flex items-center justify-between px-3 py-2"
            style={{
              background: "#CC0000",
              borderBottom: "2px solid #FFDE00",
            }}
          >
            <div className="flex items-center gap-2">
              <span className="font-pixel text-base" style={{ color: "#FFDE00" }}>
                ▸ TALKING TO: {character.name.toUpperCase()}
              </span>
            </div>
            <button
              onClick={onClose}
              className="font-pixel text-base px-2 py-0.5 touch-target"
              style={{ border: "1px solid rgba(255,222,0,0.4)", color: "#FFDE00", background: "rgba(0,0,0,0.3)" }}
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {/* Panel body */}
          <div
            className="flex flex-col gap-3 p-3"
            style={{ background: "rgba(30,6,6,0.98)" }}
          >
            {/* Character info */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-pixel text-base" style={{ color: "#FFF0B0" }}>
                  {character.name}
                </p>
                <p className="font-vt text-xl mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>
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
                minHeight: 64,
                padding: "10px 12px",
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
                          className="w-2 h-2"
                          style={{ background: "#FFDE00" }}
                          animate={{ opacity: [0.2, 1, 0.2] }}
                          transition={{ duration: 0.8, delay: i * 0.2, repeat: Infinity }}
                        />
                      ))}
                    </div>
                    <span className="font-vt text-base italic" style={{ color: "rgba(255,255,255,0.4)" }}>
                      {character.name} is considering...
                    </span>
                  </motion.div>
                ) : localResult ? (
                  <motion.div key={localResult.response} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <p className="font-vt text-lg italic leading-snug" style={{ color: "#FFF0B0" }}>
                      <TypewriterText text={`"${localResult.response}"`} />
                    </p>
                  </motion.div>
                ) : (
                  <motion.p
                    key="prompt"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="font-vt text-base italic"
                    style={{ color: "rgba(255,255,255,0.25)" }}
                  >
                    ▸ Choose how to approach {character.name}...
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Mode picker */}
            <div className="grid grid-cols-3 gap-1.5">
              {INTERACTION_MODES.map((m) => (
                <button
                  key={m.mode}
                  onClick={() => setSelectedMode(m.mode)}
                  className="touch-target flex flex-col items-center gap-0.5 transition-all duration-100"
                  style={{
                    padding: "6px 4px",
                    border: `2px solid ${selectedMode === m.mode ? m.color : m.borderColor + "60"}`,
                    background: selectedMode === m.mode ? `rgba(${hexToRgb(m.color)}, 0.15)` : "transparent",
                    boxShadow: selectedMode === m.mode ? `2px 2px 0 ${m.borderColor}60` : "none",
                    transform: selectedMode === m.mode ? "translate(-1px,-1px)" : "none",
                  }}
                >
                  <span className="text-lg leading-none">{m.emoji}</span>
                  <span className="font-pixel text-base" style={{ color: selectedMode === m.mode ? m.color : "rgba(255,255,255,0.35)" }}>
                    {m.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Mode hint */}
            <p className="text-center font-pixel text-base" style={{ color: "rgba(255,255,255,0.2)" }}>
              {modeConfig.emoji} APPROACH: {modeConfig.label}
            </p>

            {/* Input row */}
            <div className="flex gap-2 items-stretch">
              <input
                ref={inputRef}
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Say to ${character.name}...`}
                disabled={sending}
                className="flex-1 font-vt text-base px-3 py-2 outline-none disabled:opacity-50"
                style={{
                  background: "rgba(6,4,14,0.9)",
                  border: "2px solid rgba(204,0,0,0.5)",
                  color: "#FFF0B0",
                }}
                maxLength={200}
                autoComplete="off"
              />
              <motion.button
                onClick={handleSend}
                disabled={!message.trim() || sending}
                className="font-pixel text-base px-3 disabled:opacity-30"
                style={{
                  background: message.trim() && !sending ? "#CC0000" : "rgba(204,0,0,0.2)",
                  border: "2px solid #FFDE00",
                  color: "#FFDE00",
                  boxShadow: message.trim() && !sending ? "2px 2px 0 rgba(255,222,0,0.3)" : "none",
                  minWidth: 44,
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
