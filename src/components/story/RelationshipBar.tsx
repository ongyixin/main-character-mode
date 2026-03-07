"use client";

import { useEffect, useRef } from "react";
import { motion, useAnimation } from "framer-motion";
import { cn } from "@/lib/cn";
import { relationshipLabel, relationshipColor } from "@/lib/story/relationships";

interface RelationshipBarProps {
  score: number;        // -100 to 100
  delta?: number;       // recent change (to animate)
  characterName?: string;
  className?: string;
  compact?: boolean;
}

function scoreToPercent(score: number): number {
  // Map -100..100 to 0..100 for display
  return (score + 100) / 2;
}

function scoreToBarColor(score: number): string {
  if (score >= 60) return "from-rose-500 to-pink-400";
  if (score >= 30) return "from-amber-500 to-yellow-400";
  if (score >= -30) return "from-gray-500 to-gray-400";
  if (score >= -60) return "from-orange-600 to-orange-400";
  return "from-red-700 to-red-500";
}

function deltaLabel(delta: number): string {
  if (delta > 0) return `+${delta}`;
  return `${delta}`;
}

export function RelationshipBar({
  score,
  delta,
  characterName,
  className,
  compact = false,
}: RelationshipBarProps) {
  const barPercent = scoreToPercent(score);
  const barColor = scoreToBarColor(score);
  const label = relationshipLabel(score);
  const labelColor = relationshipColor(score);

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {!compact && (
        <div className="flex items-center justify-between">
          <span className="font-body text-white/60 text-xs">
            {characterName ? `${characterName}'s feelings` : "Relationship"}
          </span>
          <div className="flex items-center gap-1.5">
            <span className={cn("font-mono-dm text-xs font-semibold", labelColor)}>
              {label}
            </span>
            {delta !== undefined && delta !== 0 && (
              <motion.span
                key={delta}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={cn(
                  "font-mono-dm text-xs font-bold",
                  delta > 0 ? "text-emerald-400" : "text-red-400"
                )}
              >
                {deltaLabel(delta)}
              </motion.span>
            )}
          </div>
        </div>
      )}

      {/* Track */}
      <div className="relative h-2 rounded-full bg-white/10 overflow-hidden">
        {/* Neutral midpoint marker */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/20 z-10" />

        {/* Bar fill */}
        <motion.div
          className={cn("absolute top-0 bottom-0 left-0 rounded-full bg-gradient-to-r", barColor)}
          initial={false}
          animate={{ width: `${barPercent}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>

      {compact && (
        <div className="flex items-center justify-between">
          <span className={cn("font-mono-dm text-[9px]", labelColor)}>{label}</span>
          {delta !== undefined && delta !== 0 && (
            <span
              className={cn(
                "font-mono-dm text-[9px] font-bold",
                delta > 0 ? "text-emerald-400" : "text-red-400"
              )}
            >
              {deltaLabel(delta)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default RelationshipBar;
