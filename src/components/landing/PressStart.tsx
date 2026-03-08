"use client";

import { motion } from "framer-motion";

interface PressStartProps {
  onStart: () => void;
}

export default function PressStart({ onStart }: PressStartProps) {
  return (
    <motion.div
      role="button"
      onClick={onStart}
      className="absolute inset-0"
      style={{ zIndex: 15, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", paddingBottom: "18%" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* Blinking PRESS START */}
      <motion.div
        animate={{ opacity: [1, 1, 0, 0, 1] }}
        transition={{ duration: 1.4, times: [0, 0.45, 0.5, 0.95, 1], repeat: Infinity, ease: "linear" }}
        className="font-pixel"
        style={{
          fontSize: 16,
          letterSpacing: "0.22em",
          color: "#FFDE00",
          textShadow: "2px 2px 0 rgba(204,0,0,0.9), 0 0 24px rgba(255,222,0,0.55)",
        }}
      >
        PRESS START
      </motion.div>

      <div
        className="font-vt"
        style={{ fontSize: 16, color: "rgba(255,255,255,0.28)", marginTop: 10, letterSpacing: "0.04em" }}
      >
        tap anywhere to begin
      </div>

      {/* Subtle bottom dots indicator */}
      <div style={{ display: "flex", gap: 5, marginTop: 20 }}>
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
  );
}
