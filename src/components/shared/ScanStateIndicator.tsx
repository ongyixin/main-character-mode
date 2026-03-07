"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { ScanState } from "./Camera";

interface ScanStateIndicatorProps {
  state: ScanState;
  mode: "story" | "quest";
  onRetry?: () => void;
}

const STORY_LABELS: Record<ScanState, string> = {
  idle: "Watching",
  scanning: "Sensing...",
  analyzing: "Reading the room...",
  result_updated: "World updated",
  error: "Lost signal",
};

const QUEST_LABELS: Record<ScanState, string> = {
  idle: "Standby",
  scanning: "Scanning...",
  analyzing: "Analyzing...",
  result_updated: "Intel updated",
  error: "Scan failed",
};

export { ScanStateIndicator };
export default function ScanStateIndicator({ state, mode, onRetry }: ScanStateIndicatorProps) {
  const isQuest = mode === "quest";
  const labels = isQuest ? QUEST_LABELS : STORY_LABELS;
  const accentColor = isQuest ? "#5B6CDA" : "#B3A125";

  const isActive = state === "scanning" || state === "analyzing";
  const isError = state === "error";
  const isResult = state === "result_updated";

  return (
    <div className="flex items-center gap-2">
      {/* Status dot */}
      <div className="relative flex items-center justify-center w-5 h-5">
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: isError
              ? "rgba(204, 0, 0, 0.3)"
              : isResult
              ? "rgba(255, 222, 0, 0.3)"
              : isActive
              ? `${accentColor}30`
              : "rgba(255,255,255,0.05)",
          }}
          animate={
            isActive
              ? { scale: [1, 1.5, 1], opacity: [0.4, 0, 0.4] }
              : { scale: 1, opacity: 1 }
          }
          transition={
            isActive
              ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
              : { duration: 0.3 }
          }
        />
        <div
          className="w-2 h-2 rounded-full"
          style={{
            background: isError
              ? "#CC0000"
              : isResult
              ? "#FFDE00"
              : isActive
              ? accentColor
              : "rgba(255,255,255,0.3)",
          }}
        />
      </div>

      {/* Label */}
      <AnimatePresence mode="wait">
        <motion.span
          key={state}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.2 }}
          className="font-mono text-base tracking-wider uppercase"
          style={{
            color: isError
              ? "#CC0000"
              : isResult
              ? "#FFDE00"
              : isActive
              ? accentColor
              : "rgba(255,255,255,0.35)",
          }}
        >
          {labels[state]}
        </motion.span>
      </AnimatePresence>

      {/* Retry button on error */}
      {isError && onRetry && (
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={onRetry}
          className="font-mono text-base tracking-wider uppercase px-2 py-0.5 rounded touch-target"
          style={{
            border: "1px solid rgba(204,0,0,0.4)",
            color: "#CC0000",
          }}
        >
          Retry
        </motion.button>
      )}
    </div>
  );
}
