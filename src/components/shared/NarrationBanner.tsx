"use client";
// Dynamic narrator overlay — cinematic text at top of screen
// Used by both Story Mode (dramatic tone) and Quest Mode (mission-control tone)

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { NarrationEvent } from "@/types";

interface NarrationBannerProps {
  event: NarrationEvent | null;
  /** Mode affects visual style: story=amber, quest=cyan */
  mode?: "story" | "quest";
  autoDismissMs?: number;
}

const TONE_STYLES: Record<string, string> = {
  dramatic: "font-semibold tracking-wide",
  documentary: "font-normal tracking-widest uppercase text-xs",
  deadpan: "font-light",
  chaotic: "font-bold",
  cinematic_briefing: "font-mono text-xs tracking-widest uppercase",
  field_dispatch: "font-mono text-xs tracking-wider",
  mission_control: "font-mono text-xs tracking-widest uppercase",
};

export default function NarrationBanner({
  event,
  mode = "story",
  autoDismissMs = 5000,
}: NarrationBannerProps) {
  const [current, setCurrent] = useState<NarrationEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!event) return;
    setCurrent(event);
    setVisible(true);
    const t = setTimeout(() => setVisible(false), autoDismissMs);
    return () => clearTimeout(t);
  }, [event, autoDismissMs]);

  const accentColor = mode === "quest" ? "rgba(0,212,255,0.9)" : "rgba(200,155,60,0.9)";
  const borderColor = mode === "quest" ? "rgba(0,212,255,0.2)" : "rgba(200,155,60,0.2)";
  const toneClass = current ? (TONE_STYLES[current.tone] ?? "") : "";

  return (
    <AnimatePresence>
      {visible && current && (
        <motion.div
          key={current.id ?? current.text}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="mx-4"
        >
          <div
            className="px-4 py-3 rounded-xl"
            style={{
              background: "rgba(0,0,0,0.72)",
              backdropFilter: "blur(12px)",
              border: `1px solid ${borderColor}`,
            }}
          >
            <p
              className={`text-sm leading-snug ${toneClass}`}
              style={{ color: accentColor }}
            >
              {current.text}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Also export as named so barrel index.ts works
export { NarrationBanner };
