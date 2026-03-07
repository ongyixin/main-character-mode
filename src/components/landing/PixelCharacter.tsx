"use client";

const PX = 4;

const PALETTE: Record<number, string> = {
  1:  "#f0ece0",  // cream mainsail
  2:  "#d8ecff",  // jib
  3:  "#0f2840",  // dark navy hull
  4:  "#1a4868",  // hull lighter
  5:  "#c8a860",  // mast (wood)
  6:  "#ffe880",  // porthole warm glow
  7:  "#c03020",  // red waterline stripe
  8:  "#2a304c",  // dark cabin body
  9:  "#8aaabf",  // cabin windshield
  10: "#d4a060",  // trawler cabin wood
  11: "#1e2d1a",  // trawler dark green hull
  12: "#f07820",  // orange stack / signal light
  13: "#8890a0",  // container gray
  14: "#d86820",  // container orange
};

// ─── Sprite maps ──────────────────────────────────────────────────────────────

// Sailboat — 12 × 12 — moves right → left
const SAILBOAT_MAP: number[][] = [
  [0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 1, 5, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 1, 1, 5, 2, 0, 0, 0, 0, 0, 0],
  [0, 1, 1, 1, 5, 2, 2, 0, 0, 0, 0, 0],
  [0, 1, 1, 1, 5, 2, 2, 0, 0, 0, 0, 0],
  [0, 0, 1, 1, 5, 2, 2, 0, 0, 0, 0, 0],
  [0, 0, 0, 3, 3, 3, 3, 3, 0, 0, 0, 0],
  [0, 0, 3, 3, 6, 3, 3, 3, 3, 0, 0, 0],
  [0, 3, 4, 4, 4, 4, 4, 4, 4, 3, 0, 0],
  [0, 0, 3, 7, 7, 7, 7, 7, 3, 0, 0, 0],
  [0, 0, 0, 3, 3, 3, 3, 3, 0, 0, 0, 0],
  [0, 0, 0, 0, 3, 3, 3, 0, 0, 0, 0, 0],
];

// Motorboat — 11 × 8 — moves left → right
const MOTORBOAT_MAP: number[][] = [
  [0, 0, 7, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 8, 8, 8, 8, 0, 0, 0, 0, 0, 0],
  [0, 9, 9, 8, 8, 0, 0, 0, 0, 0, 0],
  [3, 3, 3, 3, 3, 3, 3, 3, 3, 0, 0],
  [0, 3, 4, 4, 4, 4, 4, 4, 3, 3, 0],
  [0, 0, 4, 4, 4, 4, 4, 3, 3, 0, 0],
  [0, 0, 0, 7, 7, 7, 7, 3, 0, 0, 0],
  [0, 0, 0, 0, 3, 3, 3, 0, 0, 0, 0],
];

// Fishing trawler — 12 × 7 — moves left → right
const TRAWLER_MAP: number[][] = [
  [0, 0, 12, 0,  0,  0,  0,  0,  0,  0, 0, 0],
  [0, 10, 10, 10, 10,  0,  0,  0,  0,  0, 0, 0],
  [0, 10,  6, 10, 10,  0,  0,  0,  0,  0, 0, 0],
  [11, 11, 11, 11, 11, 11, 11, 11,  0,  0, 0, 0],
  [0, 11, 11, 11, 11, 11, 11, 11, 11, 11, 0, 0],
  [0,  0,  4,  4,  4,  4,  4,  4,  4,  4, 0, 0],
  [0,  0,  0,  7,  7,  7,  7,  7,  7,  0, 0, 0],
];

// Container ship — 16 × 8 — moves right → left (slow)
const CARGO_MAP: number[][] = [
  [0,  0,  0, 13, 14, 13, 14, 13, 14,  0,  0,  0,  0,  0,  0,  0],
  [0,  0, 13, 14, 13, 14, 13, 14, 13, 14,  0,  0,  0,  0,  0,  0],
  [8,  8,  8,  8,  8,  8,  8,  8,  8,  8,  8,  8,  0,  0,  0,  0],
  [9,  8,  6,  8,  8,  8,  8,  8,  8,  8,  8,  8,  0,  0,  0,  0],
  [3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  3,  0,  0],
  [0,  3,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  4,  3,  3,  0],
  [0,  0,  0,  7,  7,  7,  7,  7,  7,  7,  7,  7,  7,  0,  0,  0],
  [0,  0,  0,  0,  3,  3,  3,  3,  3,  3,  3,  3,  0,  0,  0,  0],
];

// Little dinghy — 8 × 8 — moves right → left
const DINGHY_MAP: number[][] = [
  [0, 0, 5, 0, 0, 0, 0, 0],
  [0, 1, 5, 0, 0, 0, 0, 0],
  [1, 1, 5, 2, 0, 0, 0, 0],
  [1, 1, 5, 2, 0, 0, 0, 0],
  [0, 3, 3, 3, 3, 0, 0, 0],
  [3, 4, 4, 4, 3, 0, 0, 0],
  [0, 7, 7, 7, 0, 0, 0, 0],
  [0, 0, 3, 3, 0, 0, 0, 0],
];

// ─── Render helper ────────────────────────────────────────────────────────────

function buildBoxShadow(map: number[][], px: number): string {
  const shadows: string[] = [];
  for (let row = 0; row < map.length; row++) {
    for (let col = 0; col < map[row].length; col++) {
      const colorIdx = map[row][col];
      if (colorIdx === 0) continue;
      shadows.push(`${col * px}px ${row * px}px 0 0 ${PALETTE[colorIdx]}`);
    }
  }
  return shadows.join(", ") || "none";
}

const SAILBOAT_SHADOW  = buildBoxShadow(SAILBOAT_MAP,  PX);
const MOTORBOAT_SHADOW = buildBoxShadow(MOTORBOAT_MAP, PX);
const TRAWLER_SHADOW   = buildBoxShadow(TRAWLER_MAP,   PX);
const CARGO_SHADOW     = buildBoxShadow(CARGO_MAP,     PX);
const DINGHY_SHADOW    = buildBoxShadow(DINGHY_MAP,    PX);

const SAIL_W   = SAILBOAT_MAP[0].length  * PX;
const SAIL_H   = SAILBOAT_MAP.length     * PX;
const MOTOR_W  = MOTORBOAT_MAP[0].length * PX;
const MOTOR_H  = MOTORBOAT_MAP.length    * PX;
const TRAWL_W  = TRAWLER_MAP[0].length   * PX;
const TRAWL_H  = TRAWLER_MAP.length      * PX;
const CARGO_W  = CARGO_MAP[0].length     * PX;
const CARGO_H  = CARGO_MAP.length        * PX;
const DINGHY_W = DINGHY_MAP[0].length    * PX;
const DINGHY_H = DINGHY_MAP.length       * PX;

// ─── Component ────────────────────────────────────────────────────────────────

function Boat({
  shadow,
  w,
  h,
  bottom,
  animation,
  bobDuration,
  bobDelay = 0,
}: {
  shadow: string;
  w: number;
  h: number;
  bottom: string;
  animation: string;
  bobDuration: number;
  bobDelay?: number;
}) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        bottom,
        left: 0,
        width: w,
        height: h,
        pointerEvents: "none",
        zIndex: 3,
        animation,
        imageRendering: "pixelated",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: PX,
          height: PX,
          boxShadow: shadow,
          animation: `boatBob ${bobDuration}s ${bobDelay}s ease-in-out infinite`,
          imageRendering: "pixelated",
        }}
      />
    </div>
  );
}

export default function PixelCharacter() {
  return (
    <>
      {/* ── Row 1 (top of water) ──────────────────────────────────────────── */}

      {/* Sailboat — right → left, 55s */}
      <Boat
        shadow={SAILBOAT_SHADOW} w={SAIL_W} h={SAIL_H}
        bottom="22%"
        animation="sailBoatAcross 55s -22s linear infinite"
        bobDuration={3.2}
      />

      {/* Motorboat — left → right, 38s */}
      <Boat
        shadow={MOTORBOAT_SHADOW} w={MOTOR_W} h={MOTOR_H}
        bottom="21%"
        animation="motorBoatAcross 38s -15s linear infinite"
        bobDuration={2.0} bobDelay={0.6}
      />

      {/* ── Row 2 (mid water) ─────────────────────────────────────────────── */}

      {/* Fishing trawler — left → right, 48s */}
      <Boat
        shadow={TRAWLER_SHADOW} w={TRAWL_W} h={TRAWL_H}
        bottom="17%"
        animation="motorBoatAcross 48s -30s linear infinite"
        bobDuration={2.8} bobDelay={1.1}
      />

      {/* Container ship — right → left, very slow 80s */}
      <Boat
        shadow={CARGO_SHADOW} w={CARGO_W} h={CARGO_H}
        bottom="16%"
        animation="sailBoatAcross 80s -35s linear infinite"
        bobDuration={4.0} bobDelay={0.4}
      />

      {/* ── Row 3 (foreground water) ──────────────────────────────────────── */}

      {/* Little dinghy — right → left, 42s */}
      <Boat
        shadow={DINGHY_SHADOW} w={DINGHY_W} h={DINGHY_H}
        bottom="13%"
        animation="sailBoatAcross 42s -8s linear infinite"
        bobDuration={2.4} bobDelay={1.8}
      />
    </>
  );
}
