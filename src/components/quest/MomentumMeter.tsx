"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import type { MomentumState } from "@/types";

interface MomentumMeterProps {
  momentum: MomentumState;
  className?: string;
}

const COMBO_LABELS: Array<{ threshold: number; label: string; color: string; borderColor: string }> = [
  { threshold: 8, label: "MAX OUTPUT", color: "#FFDE00", borderColor: "#B3A125" },
  { threshold: 5, label: "LOCKED IN",  color: "#FF0000", borderColor: "#CC0000" },
  { threshold: 3, label: "MOMENTUM",   color: "#FFDE00", borderColor: "#CC0000" },
  { threshold: 1, label: "ENGAGED",    color: "#FFDE00", borderColor: "#3B4CCA" },
  { threshold: 0, label: "STANDBY",    color: "rgba(255,255,255,0.25)", borderColor: "rgba(255,255,255,0.1)" },
];

function getComboConfig(combo: number) {
  return (
    COMBO_LABELS.find((c) => combo >= c.threshold) ??
    COMBO_LABELS[COMBO_LABELS.length - 1]
  );
}

const SEGMENTS = 12;

export function MomentumMeter({ momentum, className }: MomentumMeterProps) {
  const config = getComboConfig(momentum.currentCombo);
  const score = momentum.sessionProductivityScore;
  const filledSegments = Math.round((score / 100) * SEGMENTS);

  return (
    <div
      className={cn("flex flex-col items-center gap-2 py-3 px-2", className)}
      style={{
        border: `2px solid ${config.borderColor}`,
        background: "rgba(6,8,30,0.95)",
        boxShadow: `3px 3px 0 ${config.borderColor}80`,
        minWidth: 44,
      }}
    >
      {/* Combo multiplier */}
      <motion.div
        key={momentum.currentCombo}
        initial={{ scale: 1.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.15, type: "spring" }}
        className="font-pixel tabular-nums leading-none text-center"
        style={{ color: config.color, fontSize: "14px" }}
      >
        ×{momentum.currentCombo}
      </motion.div>

      {/* Status label */}
      <div
        className="font-pixel text-center leading-tight"
        style={{ color: config.color, opacity: 0.7, fontSize: "9px", letterSpacing: "0.08em", maxWidth: 48, wordBreak: "break-all" }}
      >
        {config.label}
      </div>

      {/* Vertical segmented bar */}
      <div className="flex flex-col gap-[2px] w-full">
        {Array.from({ length: SEGMENTS })
          .reverse()
          .map((_, i) => {
            const segIndex = SEGMENTS - 1 - i;
            const isFilled = segIndex < filledSegments;
            return (
              <motion.div
                key={segIndex}
                className="h-2 w-full"
                animate={{
                  background: isFilled ? config.color : "transparent",
                  borderColor: isFilled ? config.color : config.borderColor + "40",
                }}
                transition={{ duration: 0.25, delay: segIndex * 0.015 }}
                style={{
                  border: `1px solid ${isFilled ? config.color : config.borderColor + "40"}`,
                  boxShadow: isFilled && segIndex === filledSegments - 1 ? `0 0 4px ${config.color}` : "none",
                }}
              />
            );
          })}
      </div>

      {/* Score */}
      <div
        className="font-pixel tabular-nums"
        style={{ color: "rgba(255,255,255,0.25)", fontSize: "11px" }}
      >
        {score}
      </div>

      {/* Idle warning */}
      {momentum.idlePenaltyTriggered && (
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.2, repeat: Infinity }}
          className="w-2 h-2"
          style={{ background: "#FF0000" }}
        />
      )}
    </div>
  );
}
