"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { CameraIcon, MaskIcon, SwordIcon, BoltIcon } from "./PixelIcons";

const STEPS: { num: string; icon: ReactNode; title: string; desc: string; tip: string; color: string }[] = [
  {
    num: "01",
    icon: <CameraIcon size={16} />,
    title: "SCAN YOUR WORLD",
    desc: "Point your camera at any room, space, or environment. Objects and surfaces become the raw material for your game.",
    tip: "Works indoors & outdoors",
    color: "#B0C4FF",
  },
  {
    num: "02",
    icon: <MaskIcon size={16} />,
    title: "OBJECTS AWAKEN",
    desc: "AI identifies objects and transforms them into characters with personalities, voices, and agendas. Your lamp has feelings now.",
    tip: "Every object is uniquely generated",
    color: "#C84B7A",
  },
  {
    num: "03",
    icon: <SwordIcon size={16} />,
    title: "CHOOSE YOUR ACTION",
    desc: "Story Mode: flirt, interrogate, roast or befriend objects. Quest Mode: receive cinematic missions based on your real-world tasks.",
    tip: "6 interaction modes in Story",
    color: "#FFDE00",
  },
  {
    num: "04",
    icon: <BoltIcon size={16} />,
    title: "EARN XP & PROGRESS",
    desc: "Complete quests, maintain streaks, and build momentum. An adaptive AI soundtrack reacts to your gameplay in real time.",
    tip: "Shared XP across both modes",
    color: "#3B4CCA",
  },
];

const CONTROLS = [
  { key: "TAP",   desc: "Select or confirm action" },
  { key: "HOLD",  desc: "Inspect object details" },
  { key: "←BACK", desc: "Return to previous screen" },
  { key: "SCAN",  desc: "Analyse current environment" },
];

const MODES: { icon: ReactNode; name: string; desc: string; color: string }[] = [
  { icon: <MaskIcon size={18} />, name: "STORY MODE",  desc: "Objects become characters. Drama ensues.", color: "#C84B7A" },
  { icon: <BoltIcon size={18} />, name: "QUEST MODE",  desc: "Chores become missions. Life has momentum.", color: "#3B4CCA" },
];

export default function HowToPlay() {
  return (
    <motion.div
      key="howtoplay"
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
            background: "rgba(110,40,90,0.55)",
            borderBottom: "1px solid rgba(255,222,0,0.2)",
            fontSize: 16,
            letterSpacing: "0.18em",
            color: "#FFDE00",
          }}
        >
          ✿ HOW TO PLAY
        </div>
        <div className="px-3 py-2" style={{ background: "rgba(5,2,20,0.95)" }}>
          <p className="font-vt" style={{ fontSize: 17, color: "rgba(255,238,220,0.58)", lineHeight: 1.5 }}>
            Turn your real world into a living game.
          </p>
        </div>
      </div>

      {/* Mode cards */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {MODES.map((mode) => (
          <div
            key={mode.name}
            style={{
              flex: 1,
              border: `2px solid ${mode.color}44`,
              padding: "10px 10px 8px",
              background: "rgba(5,2,20,0.9)",
              boxShadow: `3px 3px 0 ${mode.color}22`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", marginBottom: 5, color: mode.color }}>{mode.icon}</div>
            <div
              className="font-pixel"
              style={{ fontSize: 16, color: mode.color, letterSpacing: "0.1em", marginBottom: 5, lineHeight: 1.6 }}
            >
              {mode.name}
            </div>
            <p className="font-vt" style={{ fontSize: 16, color: "rgba(255,255,255,0.38)", lineHeight: 1.4 }}>
              {mode.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Steps */}
      <div
        className="font-pixel mb-3"
        style={{ fontSize: 16, color: "rgba(255,222,0,0.4)", letterSpacing: "0.2em" }}
      >
        ── GETTING STARTED ──
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
        {STEPS.map((step, i) => (
          <motion.div
            key={step.num}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07, duration: 0.22 }}
            style={{
              border: `2px solid ${step.color}33`,
              background: "rgba(5,2,20,0.92)",
              boxShadow: `3px 3px 0 ${step.color}18`,
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
              padding: "10px 12px",
              position: "relative",
            }}
          >
            {/* Step number badge */}
            <div
              className="font-pixel shrink-0"
              style={{
                fontSize: 16,
                color: step.color,
                lineHeight: 1,
                width: 22,
                textShadow: `0 0 8px ${step.color}55`,
              }}
            >
              {step.num}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <span style={{ display: "flex", alignItems: "center", color: step.color }}>{step.icon}</span>
                <span
                  className="font-pixel"
                  style={{ fontSize: 16, color: step.color, letterSpacing: "0.12em", lineHeight: 1.7 }}
                >
                  {step.title}
                </span>
              </div>
              <p className="font-vt" style={{ fontSize: 16, color: "rgba(255,255,255,0.5)", lineHeight: 1.4, marginBottom: 5 }}>
                {step.desc}
              </p>
              <div
                className="font-pixel"
                style={{
                  fontSize: 16,
                  color: "rgba(255,222,0,0.35)",
                  letterSpacing: "0.1em",
                  padding: "3px 6px",
                  border: "1px solid rgba(255,222,0,0.15)",
                  display: "inline-block",
                }}
              >
                ✦ {step.tip}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Controls reference */}
      <div
        className="font-pixel mb-3"
        style={{ fontSize: 16, color: "rgba(255,222,0,0.4)", letterSpacing: "0.2em" }}
      >
        ── CONTROLS ──
      </div>

      <div
        style={{
          border: "2px solid rgba(255,222,0,0.2)",
          background: "rgba(5,2,20,0.9)",
          boxShadow: "3px 3px 0 rgba(168,54,104,0.3)",
        }}
      >
        {CONTROLS.map((ctrl, i) => (
          <div
            key={ctrl.key}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "9px 12px",
              borderBottom: i < CONTROLS.length - 1 ? "1px solid rgba(255,222,0,0.08)" : "none",
            }}
          >
            <div
              className="font-pixel shrink-0"
              style={{
                fontSize: 16,
                color: "#FFDE00",
                border: "1px solid rgba(255,222,0,0.4)",
                padding: "3px 6px",
                letterSpacing: "0.08em",
                minWidth: 44,
                textAlign: "center",
              }}
            >
              {ctrl.key}
            </div>
            <p className="font-vt" style={{ fontSize: 16, color: "rgba(255,255,255,0.45)" }}>
              {ctrl.desc}
            </p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
