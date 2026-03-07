"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import type { MomentumState } from "@/types";

interface MomentumMeterProps {
  momentum: MomentumState;
  className?: string;
}

const COMBO_LABELS: Array<{ threshold: number; label: string; color: string }> = [
  { threshold: 8, label: "MAXIMUM OUTPUT", color: "#f59e0b" },
  { threshold: 5, label: "LOCKED IN", color: "#ef4444" },
  { threshold: 3, label: "MOMENTUM", color: "#f97316" },
  { threshold: 1, label: "ENGAGED", color: "#00d4ff" },
  { threshold: 0, label: "STANDBY", color: "rgba(255,255,255,0.3)" },
];

function getComboConfig(combo: number) {
  return (
    COMBO_LABELS.find((c) => combo >= c.threshold) ??
    COMBO_LABELS[COMBO_LABELS.length - 1]
  );
}

export function MomentumMeter({ momentum, className }: MomentumMeterProps) {
  const config = getComboConfig(momentum.currentCombo);
  const score = momentum.sessionProductivityScore;
  const segments = 12;
  const filledSegments = Math.round((score / 100) * segments);

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 py-3 px-2",
        "rounded",
        className
      )}
      style={{
        background: "rgba(2, 13, 20, 0.85)",
        border: `1px solid ${config.color}20`,
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Combo count */}
      <motion.div
        key={momentum.currentCombo}
        initial={{ scale: 1.3, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="font-mono text-2xl font-bold tabular-nums leading-none"
        style={{ color: config.color }}
      >
        ×{momentum.currentCombo}
      </motion.div>

      {/* Label */}
      <div
        className="font-mono text-[8px] tracking-[0.15em] uppercase text-center leading-none"
        style={{ color: config.color, opacity: 0.7 }}
      >
        {config.label}
      </div>

      {/* Score bar (vertical segments) */}
      <div className="flex flex-col gap-0.5 w-5">
        {Array.from({ length: segments })
          .reverse()
          .map((_, i) => {
            const segIndex = segments - 1 - i;
            const isFilled = segIndex < filledSegments;
            return (
              <motion.div
                key={segIndex}
                className="h-1.5 w-full rounded-sm"
                animate={{
                  backgroundColor: isFilled ? config.color : "rgba(255,255,255,0.06)",
                  opacity: isFilled ? 1 : 0.4,
                }}
                transition={{ duration: 0.3, delay: segIndex * 0.02 }}
              />
            );
          })}
      </div>

      {/* Score number */}
      <div
        className="font-mono text-[9px] tabular-nums"
        style={{ color: "rgba(255,255,255,0.3)" }}
      >
        {score}
      </div>

      {/* Idle warning indicator */}
      {momentum.idlePenaltyTriggered && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-2 h-2 rounded-full"
          style={{ background: "#ef4444" }}
        />
      )}
    </div>
  );
}
