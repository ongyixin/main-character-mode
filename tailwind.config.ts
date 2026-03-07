import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontSize: {
        // Override Tailwind defaults to ensure minimum 16px
        xs: "16px",      // was 0.75rem (12px)
        sm: "16px",      // was 0.875rem (14px)
        base: "16px",    // was 1rem (16px) - keep same
        lg: "18px",      // was 1.125rem (18px) - keep same
        xl: "20px",     // was 1.25rem (20px) - keep same
        "2xl": "24px",   // was 1.5rem (24px) - keep same
        "3xl": "30px",   // was 1.875rem (30px) - keep same
        "4xl": "36px",   // was 2.25rem (36px) - keep same
        "5xl": "48px",   // was 3rem (48px) - keep same
        "6xl": "60px",   // was 3.75rem (60px) - keep same
        "7xl": "72px",   // was 4.5rem (72px) - keep same
        "8xl": "96px",   // was 6rem (96px) - keep same
        "9xl": "128px",  // was 8rem (128px) - keep same
      },
      fontFamily: {
        // Primary pixel art font — HUD labels, buttons, badges
        pixel: ["var(--font-pixel)", "Courier New", "monospace"],
        // Large readable pixel font — dialogue, narration
        vt: ["var(--font-vt)", "Courier New", "monospace"],
        // Data readouts — timestamps, XP numbers
        mono: ["var(--font-dm-mono)", "Courier New", "monospace"],
        // Fallback for larger display text
        display: ["var(--font-rajdhani)", "Impact", "sans-serif"],
        // Utility aliases preserved
        "mono-dm": ["var(--font-dm-mono)", "Courier New", "monospace"],
        body: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        cinzel: ["var(--font-rajdhani)", "Georgia", "serif"],
      },
      colors: {
        // Story mode palette — Pokémon Red / Yellow
        story: {
          bg: "#06040e",
          surface: "rgba(30, 6, 6, 0.96)",
          border: "#CC0000",
          accent: "#FFDE00",
          gold: "#FFDE00",
          violet: "#FF0000",
          parchment: "#FFF0C0",
          text: "#FFF0B0",
          glow: "#CC0000",
        },
        // Quest mode palette — Pokémon Blue
        quest: {
          bg: "#06040e",
          surface: "rgba(6, 8, 30, 0.96)",
          border: "#3B4CCA",
          accent: "#FFDE00",
          green: "#FFDE00",
          blue: "#5B6CDA",
          danger: "#FF0000",
          text: "#B0C4FF",
          glow: "#3B4CCA",
        },
      },
      backgroundImage: {
        "story-gradient":
          "radial-gradient(ellipse at 30% 20%, rgba(204,0,0,0.4) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(255,222,0,0.15) 0%, transparent 60%)",
        "quest-gradient":
          "radial-gradient(ellipse at 20% 80%, rgba(59,76,202,0.4) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(255,222,0,0.08) 0%, transparent 60%)",
        "pixel-grid":
          "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
      },
      animation: {
        "fade-up": "fadeUp 0.35s steps(6) forwards",
        "fade-in": "fadeIn 0.3s ease forwards",
        pulse2: "pulse2 2s ease-in-out infinite",
        blink: "blink 1s steps(2, start) infinite",
        "pixel-pop": "pixelPop 0.25s steps(4) forwards",
        "march": "marchingAnts 0.5s steps(8) infinite",
        ticker: "ticker 0.3s steps(4) forwards",
        "slide-up": "slideUp 0.3s steps(6) forwards",
        "scanline-sweep": "scanlineSweep 3s linear infinite",
        "glow-pulse": "glowPulse 2s ease-in-out infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
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
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        pixelPop: {
          "0%": { transform: "scale(0)", opacity: "0" },
          "60%": { transform: "scale(1.15)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        marchingAnts: {
          "0%": { strokeDashoffset: "0" },
          "100%": { strokeDashoffset: "20" },
        },
        ticker: {
          "0%": { opacity: "0", transform: "translateY(-4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideUp: {
          "0%": { transform: "translateY(100%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        scanlineSweep: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        glowPulse: {
          "0%, 100%": { boxShadow: "0 0 8px rgba(255,222,0,0.3)" },
          "50%": { boxShadow: "0 0 24px rgba(255,222,0,0.7)" },
        },
      },
      spacing: {
        "safe-top": "env(safe-area-inset-top)",
        "safe-bottom": "env(safe-area-inset-bottom)",
      },
      borderWidth: {
        "3": "3px",
      },
    },
  },
  plugins: [],
};

export default config;
