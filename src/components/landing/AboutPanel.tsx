"use client";

import { motion } from "framer-motion";

const TECH_STACK = [
  { label: "GEMINI 2.0 FLASH", color: "#3B4CCA", desc: "Scene perception, narrative & NPC generation" },
  { label: "LYRIA",            color: "#B0C4FF", desc: "Real-time adaptive soundtrack generation" },
  { label: "NANOBANANA",       color: "#FFDE00", desc: "Visual asset & poster synthesis" },
  { label: "NEXT.JS 16",       color: "#5B6CDA", desc: "Web application runtime" },
];

const CREDITS = [
  { role: "CONCEPT & DESIGN",    name: "Main Character Mode Team" },
  { role: "BUILT AT",            name: "YC × Google DeepMind Hackathon 2026" },
  { role: "RUNTIME",             name: "6.5 hours" },
];

export default function AboutPanel() {
  return (
    <motion.div
      key="about"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      style={{ padding: "16px 16px 60px" }}
    >
      {/* Header */}
      <div
        style={{
          border: "2px solid rgba(255,222,0,0.35)",
          marginBottom: 14,
        }}
      >
        <div
          className="font-pixel px-3 py-2"
          style={{
            background: "rgba(204,0,0,0.5)",
            borderBottom: "1px solid rgba(255,222,0,0.2)",
            fontSize: 16,
            letterSpacing: "0.18em",
            color: "#FFDE00",
          }}
        >
          ▸ ABOUT THIS GAME
        </div>
        <div className="px-3 py-3" style={{ background: "rgba(5,2,20,0.95)" }}>
          <p className="font-vt" style={{ fontSize: 18, color: "rgba(255,255,255,0.55)", lineHeight: 1.55 }}>
            Main Character Mode is a real-time AI engine that turns your physical surroundings into a living, procedurally generated game.
          </p>
          <p className="font-vt" style={{ fontSize: 16, color: "rgba(255,255,255,0.32)", lineHeight: 1.5, marginTop: 8 }}>
            Point your camera at the world and watch it reframe itself — objects become characters, tasks become missions, and your environment becomes a stage.
          </p>
        </div>
      </div>

      {/* Version badge */}
      <div
        style={{
          display: "flex",
          gap: 6,
          marginBottom: 14,
          alignItems: "center",
        }}
      >
        <div
          className="font-pixel"
          style={{
            fontSize: 16,
            color: "#040210",
            background: "#FFDE00",
            padding: "4px 8px",
            letterSpacing: "0.1em",
          }}
        >
          BUILD 1.0.0
        </div>
        <div
          className="font-pixel"
          style={{
            fontSize: 16,
            color: "rgba(255,222,0,0.4)",
            letterSpacing: "0.12em",
          }}
        >
          HACKATHON DEMO
        </div>
        <div style={{ flex: 1 }} />
        <motion.div
          animate={{ opacity: [1, 0.2, 1] }}
          transition={{ duration: 1.8, repeat: Infinity }}
          style={{
            width: 6,
            height: 6,
            background: "#FFDE00",
            boxShadow: "0 0 6px rgba(255,222,0,0.6)",
          }}
        />
        <span className="font-pixel" style={{ fontSize: 16, color: "#FFDE00" }}>LIVE</span>
      </div>

      {/* Tech stack */}
      <div
        className="font-pixel mb-3"
        style={{ fontSize: 16, color: "rgba(255,222,0,0.4)", letterSpacing: "0.2em" }}
      >
        ── POWERED BY ──
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
        {TECH_STACK.map((tech, i) => (
          <motion.div
            key={tech.label}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06, duration: 0.2 }}
            style={{
              border: `2px solid ${tech.color}44`,
              background: "rgba(5,2,20,0.92)",
              padding: "10px 12px",
              boxShadow: `3px 3px 0 ${tech.color}18`,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                background: tech.color,
                flexShrink: 0,
                boxShadow: `0 0 8px ${tech.color}66`,
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                className="font-pixel"
                style={{ fontSize: 16, color: tech.color, letterSpacing: "0.1em", marginBottom: 3, lineHeight: 1.6 }}
              >
                {tech.label}
              </div>
              <p className="font-vt" style={{ fontSize: 16, color: "rgba(255,255,255,0.38)", lineHeight: 1.3 }}>
                {tech.desc}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Credits */}
      <div
        className="font-pixel mb-3"
        style={{ fontSize: 16, color: "rgba(255,222,0,0.4)", letterSpacing: "0.2em" }}
      >
        ── CREDITS ──
      </div>

      <div
        style={{
          border: "2px solid rgba(255,222,0,0.2)",
          background: "rgba(5,2,20,0.9)",
          boxShadow: "3px 3px 0 rgba(204,0,0,0.3)",
        }}
      >
        {CREDITS.map((c, i) => (
          <div
            key={c.role}
            style={{
              padding: "10px 14px",
              borderBottom: i < CREDITS.length - 1 ? "1px solid rgba(255,222,0,0.08)" : "none",
            }}
          >
            <div
              className="font-pixel"
              style={{ fontSize: 16, color: "rgba(255,222,0,0.35)", letterSpacing: "0.12em", marginBottom: 4, lineHeight: 1 }}
            >
              {c.role}
            </div>
            <div className="font-vt" style={{ fontSize: 18, color: "rgba(255,255,255,0.55)" }}>
              {c.name}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Easter egg */}
      <div
        className="font-pixel text-center mt-6"
        style={{ fontSize: 16, color: "rgba(255,255,255,0.07)", letterSpacing: "0.18em" }}
      >
        YOUR WORLD IS ALREADY A GAME. YOU JUST HAVEN&apos;T NOTICED.
      </div>
    </motion.div>
  );
}
