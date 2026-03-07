"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

interface PixelCreatureProps {
  variant?: "blue" | "coral" | "mint" | "yellow";
  size?: number;
  className?: string;
  animate?: boolean;
}

const PALETTE = {
  blue:  { body: "#6EC5FF", dark: "#4DAEE8", eye: "#2B2B2B", cheek: "#FF7E79" },
  coral: { body: "#FF7E79", dark: "#E86560", eye: "#2B2B2B", cheek: "#FFD95A" },
  mint:  { body: "#7DE2A6", dark: "#5CC889", eye: "#2B2B2B", cheek: "#FF7E79" },
  yellow:{ body: "#FFD95A", dark: "#E6C24A", eye: "#2B2B2B", cheek: "#FF7E79" },
};

/**
 * Cute pixel creature rendered as an SVG pixel grid.
 * Each creature is a simple 8x8-ish blob with eyes, cheeks, and limbs.
 * 100% original — no copyrighted references.
 */
export function PixelCreature({ variant = "blue", size = 64, className, animate = true }: PixelCreatureProps) {
  const c = PALETTE[variant];

  return (
    <motion.div
      className={cn("relative pixel-blink", className)}
      style={{ width: size, height: size, imageRendering: "pixelated" }}
      initial={animate ? { scale: 0, opacity: 0 } : false}
      animate={animate ? { scale: 1, opacity: 1 } : undefined}
      transition={{ duration: 0.5, type: "spring", bounce: 0.5 }}
    >
      <svg
        viewBox="0 0 16 16"
        width={size}
        height={size}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ imageRendering: "pixelated" }}
        shapeRendering="crispEdges"
      >
        {/* Body blob */}
        <rect x="4" y="3" width="8" height="8" fill={c.body} />
        <rect x="3" y="4" width="1" height="6" fill={c.body} />
        <rect x="12" y="4" width="1" height="6" fill={c.body} />
        <rect x="5" y="2" width="6" height="1" fill={c.body} />
        <rect x="5" y="11" width="6" height="1" fill={c.body} />

        {/* Shadow / darker underside */}
        <rect x="4" y="9" width="8" height="2" fill={c.dark} />
        <rect x="3" y="8" width="1" height="2" fill={c.dark} />
        <rect x="12" y="8" width="1" height="2" fill={c.dark} />
        <rect x="5" y="11" width="6" height="1" fill={c.dark} />

        {/* Eyes */}
        <rect x="6" y="5" width="1" height="2" fill={c.eye} />
        <rect x="9" y="5" width="1" height="2" fill={c.eye} />

        {/* Eye highlights */}
        <rect x="6" y="5" width="1" height="1" fill="white" opacity="0.5" />
        <rect x="9" y="5" width="1" height="1" fill="white" opacity="0.5" />

        {/* Cheeks */}
        <rect x="5" y="7" width="1" height="1" fill={c.cheek} opacity="0.6" />
        <rect x="10" y="7" width="1" height="1" fill={c.cheek} opacity="0.6" />

        {/* Mouth - small smile */}
        <rect x="7" y="8" width="2" height="1" fill={c.eye} opacity="0.5" />

        {/* Feet */}
        <rect x="5" y="12" width="2" height="1" fill={c.body} />
        <rect x="9" y="12" width="2" height="1" fill={c.body} />

        {/* Little ears/antenna */}
        <rect x="5" y="1" width="1" height="1" fill={c.body} />
        <rect x="10" y="1" width="1" height="1" fill={c.body} />
        <rect x="4" y="2" width="1" height="1" fill={c.dark} opacity="0.4" />
        <rect x="11" y="2" width="1" height="1" fill={c.dark} opacity="0.4" />
      </svg>
    </motion.div>
  );
}

/** Simple pixel sparkle star for decorative use. */
export function PixelSparkle({ size = 12, color = "#FFD95A", className }: { size?: number; color?: string; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 8 8"
      width={size}
      height={size}
      fill="none"
      shapeRendering="crispEdges"
      style={{ imageRendering: "pixelated" }}
    >
      <rect x="3" y="0" width="2" height="2" fill={color} />
      <rect x="0" y="3" width="2" height="2" fill={color} />
      <rect x="6" y="3" width="2" height="2" fill={color} />
      <rect x="3" y="6" width="2" height="2" fill={color} />
      <rect x="3" y="3" width="2" height="2" fill="white" opacity="0.6" />
    </svg>
  );
}
