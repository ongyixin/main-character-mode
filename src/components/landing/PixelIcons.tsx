/**
 * Pixel art SVG icons for the TabBar.
 * Each icon is drawn on a small integer grid with shapeRendering="crispEdges"
 * so they stay razor-sharp at any display size.
 */

interface IconProps {
  size?: number;
  color?: string;
}

/** Right-pointing triangle — PLAY tab */
export function PlayIcon({ size = 14, color = "currentColor" }: IconProps) {
  return (
    <svg
      viewBox="0 0 5 9"
      width={size}
      height={size}
      shapeRendering="crispEdges"
      fill={color}
      style={{ display: "block" }}
    >
      {/* Each column narrows as it goes right, forming a pixel triangle */}
      <rect x="0" y="0" width="1" height="9" />
      <rect x="1" y="1" width="1" height="7" />
      <rect x="2" y="2" width="1" height="5" />
      <rect x="3" y="3" width="1" height="3" />
      <rect x="4" y="4" width="1" height="1" />
    </svg>
  );
}

/** Pixel question mark — GUIDE / HOW TO PLAY tab */
export function QuestionIcon({ size = 14, color = "currentColor" }: IconProps) {
  return (
    <svg
      viewBox="0 0 6 9"
      width={size}
      height={size}
      shapeRendering="crispEdges"
      fill={color}
      style={{ display: "block" }}
    >
      {/* Top arch */}
      <rect x="1" y="0" width="4" height="1" />
      <rect x="0" y="1" width="1" height="1" />
      <rect x="5" y="1" width="1" height="2" />
      {/* Rightward hook curling down-left */}
      <rect x="4" y="3" width="1" height="1" />
      <rect x="3" y="4" width="1" height="1" />
      {/* Stem */}
      <rect x="2" y="5" width="1" height="2" />
      {/* Dot */}
      <rect x="2" y="8" width="1" height="1" />
    </svg>
  );
}

/** Pixel "i" info symbol — ABOUT tab */
export function InfoIcon({ size = 14, color = "currentColor" }: IconProps) {
  return (
    <svg
      viewBox="0 0 6 9"
      width={size}
      height={size}
      shapeRendering="crispEdges"
      fill={color}
      style={{ display: "block" }}
    >
      {/* Dot */}
      <rect x="2" y="0" width="2" height="1" />
      {/* Top bar */}
      <rect x="1" y="2" width="4" height="1" />
      {/* Stem */}
      <rect x="2" y="3" width="2" height="3" />
      {/* Base bar */}
      <rect x="1" y="6" width="4" height="1" />
    </svg>
  );
}

/** Pixel shield with cross — GUILD / COMMUNITY tab */
export function ShieldIcon({ size = 14, color = "currentColor" }: IconProps) {
  return (
    <svg
      viewBox="0 0 7 8"
      width={size}
      height={size}
      shapeRendering="crispEdges"
      fill={color}
      style={{ display: "block" }}
    >
      {/* Top bar */}
      <rect x="0" y="0" width="7" height="1" />
      {/* Left & right sides */}
      <rect x="0" y="1" width="1" height="4" />
      <rect x="6" y="1" width="1" height="4" />
      {/* Cross — vertical */}
      <rect x="3" y="1" width="1" height="4" />
      {/* Cross — horizontal */}
      <rect x="1" y="3" width="5" height="1" />
      {/* Narrowing toward tip */}
      <rect x="1" y="5" width="1" height="1" />
      <rect x="5" y="5" width="1" height="1" />
      <rect x="2" y="6" width="1" height="1" />
      <rect x="4" y="6" width="1" height="1" />
      <rect x="3" y="7" width="1" height="1" />
    </svg>
  );
}

/** Pixel cogwheel — SETTINGS tab */
export function GearIcon({ size = 14, color = "currentColor" }: IconProps) {
  return (
    <svg
      viewBox="0 0 11 9"
      width={size}
      height={size}
      shapeRendering="crispEdges"
      fill={color}
      style={{ display: "block" }}
    >
      {/* Top tooth */}
      <rect x="4" y="0" width="3" height="1" />
      {/* Body — top taper */}
      <rect x="3" y="1" width="5" height="1" />
      {/* Body — wide middle band (left + right teeth here) */}
      <rect x="2" y="2" width="1" height="5" />
      <rect x="8" y="2" width="1" height="5" />
      <rect x="3" y="2" width="5" height="5" />
      {/* Left tooth */}
      <rect x="0" y="3" width="2" height="3" />
      {/* Right tooth */}
      <rect x="9" y="3" width="2" height="3" />
      {/* Body — bottom taper */}
      <rect x="3" y="7" width="5" height="1" />
      {/* Bottom tooth */}
      <rect x="4" y="8" width="3" height="1" />
    </svg>
  );
}

/** Pixel speaker with waves — SOUND ON */
export function SoundOnIcon({ size = 14, color = "currentColor" }: IconProps) {
  return (
    <svg
      viewBox="0 0 9 7"
      width={size}
      height={size}
      shapeRendering="crispEdges"
      fill={color}
      style={{ display: "block" }}
    >
      {/* Speaker cone (trapezoid pointing right) */}
      <rect x="2" y="0" width="2" height="1" />
      <rect x="1" y="1" width="3" height="1" />
      <rect x="0" y="2" width="4" height="3" />
      <rect x="1" y="5" width="3" height="1" />
      <rect x="2" y="6" width="2" height="1" />
      {/* Inner wave */}
      <rect x="5" y="2" width="1" height="3" />
      {/* Outer wave */}
      <rect x="7" y="1" width="1" height="5" />
    </svg>
  );
}

/** Pixel speaker with X — SOUND OFF */
export function SoundOffIcon({ size = 14, color = "currentColor" }: IconProps) {
  return (
    <svg
      viewBox="0 0 9 7"
      width={size}
      height={size}
      shapeRendering="crispEdges"
      fill={color}
      style={{ display: "block" }}
    >
      {/* Speaker cone (same shape as sound-on) */}
      <rect x="2" y="0" width="2" height="1" />
      <rect x="1" y="1" width="3" height="1" />
      <rect x="0" y="2" width="4" height="3" />
      <rect x="1" y="5" width="3" height="1" />
      <rect x="2" y="6" width="2" height="1" />
      {/* X — two diagonal strokes */}
      <rect x="5" y="2" width="1" height="1" />
      <rect x="7" y="2" width="1" height="1" />
      <rect x="6" y="3" width="1" height="1" />
      <rect x="5" y="4" width="1" height="1" />
      <rect x="7" y="4" width="1" height="1" />
    </svg>
  );
}
