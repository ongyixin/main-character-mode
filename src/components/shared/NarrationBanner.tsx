"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { NarrationEvent } from "@/types";

interface NarrationBannerProps {
  event: NarrationEvent | null;
  mode?: "story" | "quest";
  autoDismissMs?: number;
}

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

  const isStory = mode === "story";
  const borderColor = isStory ? "#CC0000" : "#3B4CCA";
  const accentColor = isStory ? "#FFDE00" : "#FFDE00";
  const bgColor = isStory ? "rgba(30,6,6,0.97)" : "rgba(6,8,30,0.97)";
  const shadowColor = isStory ? "rgba(204,0,0,0.6)" : "rgba(59,76,202,0.6)";
  const label = isStory ? "▸ NARRATOR" : "▸ FIELD DISPATCH";

  return (
    <AnimatePresence>
      {visible && current && (
        <motion.div
          key={current.id ?? current.text}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25 }}
          className="mx-0"
        >
          <div
            style={{
              border: `2px solid ${borderColor}`,
              background: bgColor,
              boxShadow: `3px 3px 0 ${shadowColor}`,
            }}
          >
            {/* Header chrome */}
            <div
              className="flex items-center gap-2 px-3 py-1"
              style={{
                background: borderColor,
                borderBottom: `1px solid ${accentColor}40`,
              }}
            >
              <div
                className="w-1.5 h-1.5 animate-pulse2"
                style={{ background: accentColor }}
              />
              <span className="font-pixel text-base tracking-wider" style={{ color: accentColor }}>
                {label}
              </span>
            </div>
            {/* Message */}
            <div className="px-3 py-2.5">
              <p className="font-vt text-xl leading-snug" style={{ color: isStory ? "#FFF0B0" : "#B0C4FF" }}>
                {current.text}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export { NarrationBanner };
