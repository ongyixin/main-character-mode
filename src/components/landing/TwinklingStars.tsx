"use client";

// Cross-shaped pixel art stars
const STAR_SM: number[][] = [
  [0, 1, 0],
  [1, 1, 1],
  [0, 1, 0],
];

const STAR_LG: number[][] = [
  [0, 0, 1, 0, 0],
  [0, 1, 1, 1, 0],
  [1, 1, 1, 1, 1],
  [0, 1, 1, 1, 0],
  [0, 0, 1, 0, 0],
];

function buildBoxShadow(map: number[][], px: number, color: string): string {
  const shadows: string[] = [];
  for (let row = 0; row < map.length; row++) {
    for (let col = 0; col < map[row].length; col++) {
      if (map[row][col] === 0) continue;
      shadows.push(`${col * px}px ${row * px}px 0 0 ${color}`);
    }
  }
  return shadows.join(", ") || "none";
}

interface StarDef {
  left: string;
  top: string;
  px: number;
  map: number[][];
  color: string;
  delay: string;
  duration: string;
}

const STARS: StarDef[] = [
  // ── upper band ──────────────────────────────────────────────────────────────
  { left: "2%",  top: "6%",  px: 2, map: STAR_SM, color: "#FFD700", delay: "0s",    duration: "1.8s" },
  { left: "6%",  top: "18%", px: 3, map: STAR_LG, color: "#FFFDE7", delay: "0.4s",  duration: "2.3s" },
  { left: "11%", top: "3%",  px: 2, map: STAR_LG, color: "#C0E8FF", delay: "1.1s",  duration: "1.5s" },
  { left: "17%", top: "22%", px: 2, map: STAR_SM, color: "#FFD700", delay: "0.7s",  duration: "2.0s" },
  { left: "23%", top: "8%",  px: 3, map: STAR_LG, color: "#FFFDE7", delay: "1.5s",  duration: "1.7s" },
  { left: "29%", top: "24%", px: 2, map: STAR_SM, color: "#FFB6C1", delay: "0.2s",  duration: "2.5s" },
  { left: "35%", top: "5%",  px: 2, map: STAR_LG, color: "#FFFDE7", delay: "0.9s",  duration: "1.9s" },
  { left: "42%", top: "20%", px: 3, map: STAR_LG, color: "#FFD700", delay: "1.8s",  duration: "2.1s" },
  { left: "48%", top: "2%",  px: 2, map: STAR_SM, color: "#C0E8FF", delay: "0.5s",  duration: "1.6s" },
  { left: "54%", top: "15%", px: 2, map: STAR_LG, color: "#FFFDE7", delay: "1.3s",  duration: "2.4s" },
  { left: "60%", top: "24%", px: 3, map: STAR_LG, color: "#FFD700", delay: "0.1s",  duration: "1.8s" },
  { left: "65%", top: "7%",  px: 2, map: STAR_SM, color: "#FFB6C1", delay: "2.0s",  duration: "2.2s" },
  { left: "70%", top: "17%", px: 2, map: STAR_LG, color: "#FFFDE7", delay: "0.6s",  duration: "1.5s" },
  { left: "76%", top: "4%",  px: 3, map: STAR_LG, color: "#C0E8FF", delay: "1.4s",  duration: "2.0s" },
  { left: "81%", top: "21%", px: 2, map: STAR_SM, color: "#FFD700", delay: "0.3s",  duration: "1.7s" },
  { left: "87%", top: "10%", px: 2, map: STAR_LG, color: "#FFFDE7", delay: "1.7s",  duration: "2.3s" },
  { left: "92%", top: "23%", px: 2, map: STAR_SM, color: "#FFD700", delay: "2.2s",  duration: "1.6s" },
  { left: "96%", top: "7%",  px: 2, map: STAR_SM, color: "#C0E8FF", delay: "0.8s",  duration: "2.1s" },
  // ── lower band ──────────────────────────────────────────────────────────────
  { left: "4%",  top: "38%", px: 2, map: STAR_SM, color: "#FFFDE7", delay: "1.2s",  duration: "2.0s" },
  { left: "9%",  top: "52%", px: 3, map: STAR_LG, color: "#FFD700", delay: "0.3s",  duration: "1.7s" },
  { left: "15%", top: "43%", px: 2, map: STAR_SM, color: "#C0E8FF", delay: "1.9s",  duration: "2.4s" },
  { left: "20%", top: "60%", px: 2, map: STAR_LG, color: "#FFFDE7", delay: "0.6s",  duration: "1.6s" },
  { left: "26%", top: "35%", px: 3, map: STAR_LG, color: "#FFB6C1", delay: "1.4s",  duration: "2.2s" },
  { left: "32%", top: "55%", px: 2, map: STAR_SM, color: "#FFD700", delay: "0.1s",  duration: "1.9s" },
  { left: "38%", top: "40%", px: 2, map: STAR_LG, color: "#C0E8FF", delay: "2.3s",  duration: "2.5s" },
  { left: "44%", top: "62%", px: 3, map: STAR_LG, color: "#FFFDE7", delay: "0.7s",  duration: "1.8s" },
  { left: "50%", top: "36%", px: 2, map: STAR_SM, color: "#FFD700", delay: "1.6s",  duration: "2.1s" },
  { left: "57%", top: "50%", px: 2, map: STAR_LG, color: "#FFB6C1", delay: "0.4s",  duration: "1.5s" },
  { left: "63%", top: "42%", px: 3, map: STAR_LG, color: "#FFFDE7", delay: "2.1s",  duration: "2.3s" },
  { left: "68%", top: "58%", px: 2, map: STAR_SM, color: "#FFD700", delay: "0.9s",  duration: "1.7s" },
  { left: "74%", top: "34%", px: 2, map: STAR_LG, color: "#C0E8FF", delay: "1.5s",  duration: "2.0s" },
  { left: "79%", top: "53%", px: 3, map: STAR_LG, color: "#FFFDE7", delay: "0.2s",  duration: "1.6s" },
  { left: "85%", top: "39%", px: 2, map: STAR_SM, color: "#FFD700", delay: "1.0s",  duration: "2.4s" },
  { left: "90%", top: "57%", px: 2, map: STAR_LG, color: "#FFB6C1", delay: "1.8s",  duration: "2.2s" },
  { left: "94%", top: "44%", px: 2, map: STAR_SM, color: "#FFFDE7", delay: "0.5s",  duration: "1.9s" },
];

export default function TwinklingStars() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "28%",
        pointerEvents: "none",
        zIndex: 3,
        overflow: "hidden",
      }}
    >
      {STARS.map((star, i) => {
        const boxShadow = buildBoxShadow(star.map, star.px, star.color);
        const w = star.map[0].length * star.px;
        const h = star.map.length * star.px;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: star.left,
              top: star.top,
              width: w,
              height: h,
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: star.px,
                height: star.px,
                boxShadow,
                animation: `starTwinkle ${star.duration} ease-in-out ${star.delay} infinite`,
                imageRendering: "pixelated",
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
