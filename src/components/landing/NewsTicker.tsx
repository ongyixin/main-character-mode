"use client";

const MESSAGES = [
  "▶ NEW: FANTASY MODE UNLOCKED -- ANCIENT POWER STIRS IN THE MUNDANE",
  "★ VER 1.0 -- YC × GOOGLE DEEPMIND HACKATHON 2026",
  "◆ TIP: ROAST YOUR FURNITURE FOR MAXIMUM RELATIONSHIP DRAMA",
  "▶ TIP: QUEST MODE CONVERTS GROCERIES INTO TACTICAL SUPPLY RUNS",
  "★ WORLD STATUS: OBJECTS ARE WATCHING. RESPOND ACCORDINGLY.",
  "◆ NEW: SOAP OPERA GENRE NOW FEATURES 400% MORE BETRAYAL",
  "▶ TIP: 3 QUESTS IN A ROW ACTIVATES YOUR COMBO MULTIPLIER",
  "★ MYSTERY MODE: EVERY OBJECT IS A SUSPECT. EVEN THE LAMP.",
];

const TICKER_TEXT = MESSAGES.join("     ◈     ");

export default function NewsTicker() {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: 38,
        background: "rgba(4,1,14,0.97)",
        borderTop: "2px solid rgba(255,222,0,0.28)",
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
        zIndex: 30,
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      {/* NEWS badge */}
      <div
        className="font-pixel shrink-0"
        style={{
          fontSize: 16,
          color: "#040210",
          background: "#FFDE00",
          padding: "0 8px",
          letterSpacing: "0.1em",
          height: "100%",
          display: "flex",
          alignItems: "center",
          borderRight: "2px solid rgba(179,161,37,0.6)",
          zIndex: 2,
        }}
      >
        NEWS
      </div>

      {/* Scrolling track — duplicated for seamless loop */}
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        <div
          style={{
            display: "flex",
            width: "max-content",
            animation: "tickerLoop 40s linear infinite",
          }}
        >
          <span
            className="font-pixel"
            style={{
              fontSize: 16,
              color: "rgba(255,222,0,0.72)",
              letterSpacing: "0.12em",
              lineHeight: 1,
              paddingLeft: 14,
              whiteSpace: "nowrap",
            }}
          >
            {TICKER_TEXT}
          </span>
          <span
            className="font-pixel"
            style={{
              fontSize: 16,
              color: "rgba(255,222,0,0.72)",
              letterSpacing: "0.12em",
              lineHeight: 1,
              paddingLeft: 60,
              whiteSpace: "nowrap",
            }}
          >
            {TICKER_TEXT}
          </span>
        </div>
      </div>
    </div>
  );
}
