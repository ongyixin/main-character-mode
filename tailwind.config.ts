import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Cinzel: dramatic, roman epic feeling for story mode titles
        display: ["var(--font-cinzel)", "Georgia", "serif"],
        // DM Mono: dry mission-control readout feeling for quest mode
        mono: ["var(--font-dm-mono)", "Courier New", "monospace"],
        // Outfit: clean, modern body copy
        body: ["var(--font-outfit)", "system-ui", "sans-serif"],
      },
      colors: {
        // Story mode palette: warm mystic purples/golds
        story: {
          bg: "#0a0612",
          accent: "#c89b3c",
          glow: "#7b3fc4",
          surface: "rgba(20, 10, 40, 0.7)",
          border: "rgba(200, 155, 60, 0.25)",
        },
        // Quest mode palette: cold tactical cyans/slates
        quest: {
          bg: "#020d14",
          accent: "#00d4ff",
          glow: "#0066aa",
          surface: "rgba(2, 20, 35, 0.75)",
          border: "rgba(0, 212, 255, 0.2)",
        },
      },
      backgroundImage: {
        "story-gradient":
          "radial-gradient(ellipse at 30% 20%, rgba(123,63,196,0.35) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(200,155,60,0.2) 0%, transparent 60%)",
        "quest-gradient":
          "radial-gradient(ellipse at 20% 80%, rgba(0,102,170,0.4) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(0,212,255,0.15) 0%, transparent 60%)",
        "glass-shimmer":
          "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)",
      },
      animation: {
        "fade-up": "fadeUp 0.6s ease forwards",
        "fade-in": "fadeIn 0.4s ease forwards",
        pulse2: "pulse2 2s ease-in-out infinite",
        scanline: "scanline 3s linear infinite",
        "glow-pulse": "glowPulse 2s ease-in-out infinite",
        ticker: "ticker 0.3s ease-out forwards",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        pulse2: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        scanline: {
          "0%": { backgroundPosition: "0 0" },
          "100%": { backgroundPosition: "0 100%" },
        },
        glowPulse: {
          "0%, 100%": { boxShadow: "0 0 8px rgba(0,212,255,0.3)" },
          "50%": { boxShadow: "0 0 24px rgba(0,212,255,0.7)" },
        },
        ticker: {
          "0%": { opacity: "0", transform: "translateY(-4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      spacing: {
        "safe-top": "env(safe-area-inset-top)",
        "safe-bottom": "env(safe-area-inset-bottom)",
      },
    },
  },
  plugins: [],
};

export default config;
