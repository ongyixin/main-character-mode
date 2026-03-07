"use client";

import { useState, useEffect } from "react";

interface Stats {
  sessions: number;
  totalXP: number;
  bestStreak: number;
}

function loadStats(): Stats {
  try {
    const s = localStorage.getItem("mcm_stats");
    return s ? JSON.parse(s) : { sessions: 0, totalXP: 0, bestStreak: 0 };
  } catch {
    return { sessions: 0, totalXP: 0, bestStreak: 0 };
  }
}

const STAT_DEFS = [
  { key: "sessions" as const, label: "SESSIONS", icon: "♥", color: "#C84B7A" },
  { key: "totalXP" as const, label: "TOTAL XP",  icon: "★", color: "#FFDE00" },
  { key: "bestStreak" as const, label: "STREAK",   icon: "✦", color: "#3B4CCA" },
];

export default function QuickStats() {
  const [stats, setStats] = useState<Stats>({ sessions: 0, totalXP: 0, bestStreak: 0 });

  useEffect(() => {
    setStats(loadStats());
  }, []);

  return (
    <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
      {STAT_DEFS.map(({ key, label, icon, color }) => (
        <div
          key={key}
          style={{
            flex: 1,
            border: `1px solid rgba(255,222,0,0.18)`,
            padding: "7px 4px 6px",
            background: "rgba(5,2,20,0.82)",
            textAlign: "center",
            position: "relative",
          }}
        >
          {/* Corner accent */}
          <div style={{ position: "absolute", top: 0, left: 0, width: 4, height: 1, background: color, opacity: 0.6 }} />
          <div style={{ position: "absolute", top: 0, left: 0, width: 1, height: 4, background: color, opacity: 0.6 }} />
          <div style={{ position: "absolute", top: 0, right: 0, width: 4, height: 1, background: color, opacity: 0.6 }} />
          <div style={{ position: "absolute", top: 0, right: 0, width: 1, height: 4, background: color, opacity: 0.6 }} />

          <div
            className="font-pixel"
            style={{ fontSize: 16, color: "rgba(255,228,240,0.38)", letterSpacing: "0.06em", marginBottom: 4, lineHeight: 1 }}
          >
            {icon} {label}
          </div>
          <div
            className="font-pixel"
            style={{ fontSize: 16, color, lineHeight: 1, textShadow: `0 0 8px ${color}55` }}
          >
            {stats[key]}
          </div>
        </div>
      ))}
    </div>
  );
}
