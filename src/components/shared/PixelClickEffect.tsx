"use client";

import { useEffect, useRef, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Particle {
  id: number;
  x: number;
  y: number;
  symbol: string;
  color: string;
  dx: number;   // horizontal drift (px)
  dy: number;   // vertical rise (px, negative = up)
  size: number; // font-size in px
}

// ─── Particle pool config ─────────────────────────────────────────────────────

const SYMBOLS = ["♥", "✦", "♡", "✿", "★"];
const COLORS  = [
  "#FFDE00",                // gold
  "#E8709A",                // rose / story-mode pink
  "#B0C4FF",                // periwinkle / quest-mode blue
  "rgba(255,160,210,0.9)",  // soft pink
  "rgba(200,170,255,0.9)",  // lavender
];

let uid = 0;

function makeParticles(x: number, y: number): Particle[] {
  const count = 4 + Math.floor(Math.random() * 3); // 4–6 particles
  return Array.from({ length: count }, () => {
    const angle = (Math.random() * 2 * Math.PI);
    const speed = 28 + Math.random() * 28;
    return {
      id:     ++uid,
      x,
      y,
      symbol: SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      color:  COLORS[Math.floor(Math.random() * COLORS.length)],
      dx:     Math.cos(angle) * speed,
      dy:     Math.sin(angle) * speed - 20, // bias upward
      size:   8 + Math.floor(Math.random() * 3) * 2, // 8 | 10 | 12 (even = pixel grid)
    };
  });
}

// ─── Animation keyframes (injected once) ─────────────────────────────────────

const STYLE_ID = "pixel-click-fx-style";

function ensureKeyframes() {
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes pixelClickFloat {
      0%   { opacity: 1;   transform: translate(0px, 0px)   scale(1); }
      60%  { opacity: 0.8; }
      100% { opacity: 0;   transform: translate(var(--pdx), var(--pdy)) scale(0.5); }
    }
    .pixel-click-particle {
      position: fixed;
      pointer-events: none;
      z-index: 99999;
      line-height: 1;
      image-rendering: pixelated;
      -webkit-font-smoothing: none;
      font-family: var(--font-pixel, monospace);
      animation: pixelClickFloat 0.55s steps(8) forwards;
      user-select: none;
    }
  `;
  document.head.appendChild(style);
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PixelClickEffect() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const spawnParticles = useCallback((e: MouseEvent) => {
    const container = containerRef.current;
    if (!container) return;

    const particles = makeParticles(e.clientX, e.clientY);

    particles.forEach((p) => {
      const el = document.createElement("span");
      el.className = "pixel-click-particle";
      el.textContent = p.symbol;
      el.style.cssText = `
        left: ${p.x}px;
        top:  ${p.y}px;
        color: ${p.color};
        font-size: ${p.size}px;
        text-shadow: 1px 1px 0 rgba(2,1,17,0.9);
        --pdx: ${p.dx.toFixed(1)}px;
        --pdy: ${p.dy.toFixed(1)}px;
      `;
      container.appendChild(el);
      // Remove from DOM after animation ends to avoid accumulation
      el.addEventListener("animationend", () => el.remove(), { once: true });
    });
  }, []);

  useEffect(() => {
    ensureKeyframes();
    window.addEventListener("click", spawnParticles);
    return () => window.removeEventListener("click", spawnParticles);
  }, [spawnParticles]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 99999,
        overflow: "hidden",
      }}
    />
  );
}
