"use client";

/**
 * GestureOverlay — picture-in-picture panel showing the front-camera feed
 * and the currently detected gesture label.
 *
 * Now powered by the Overshoot gesture stream (clip mode) instead of
 * MediaPipe — landmarks are gone, but the gesture label and PiP display remain.
 */

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { DetectedGesture } from "@/hooks/useOvershootGestures";

// ─── Gesture display info ─────────────────────────────────────────────────────

interface GestureDisplay {
  icon: string;
  label: string;
  color: string;
}

const GESTURE_DISPLAY: Record<string, GestureDisplay> = {
  thumbs_up:   { icon: "👍", label: "THUMBS UP",   color: "#34d399" },
  thumbs_down: { icon: "👎", label: "THUMBS DOWN", color: "#f87171" },
  victory:     { icon: "✌️", label: "VICTORY",     color: "#FFDE00" },
  open_palm:   { icon: "🖐️", label: "OPEN PALM",   color: "#60a5fa" },
  closed_fist: { icon: "✊", label: "FIST",        color: "#f87171" },
  pointing:    { icon: "☝️", label: "POINTING",    color: "#a78bfa" },
  i_love_you:  { icon: "🤟", label: "I LOVE YOU",  color: "#f472b6" },
};

function getDisplay(label: string | null): GestureDisplay {
  if (!label) return { icon: "·", label: "SCANNING…", color: "#6b7280" };
  return GESTURE_DISPLAY[label] ?? { icon: "❓", label: label.toUpperCase(), color: "#e5e7eb" };
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface GestureOverlayProps {
  /** MediaStream from useOvershootGestures — used for the PiP video preview. */
  stream: MediaStream | null;
  gesture: DetectedGesture | null;
  isReady: boolean;
  modelError: string | null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function GestureOverlay({
  stream,
  gesture,
  isReady,
  modelError,
}: GestureOverlayProps) {
  const [collapsed, setCollapsed] = useState(false);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);

  const display = getDisplay(gesture?.label ?? null);

  // Attach the Overshoot gesture stream to the PiP video element
  useEffect(() => {
    const video = videoPreviewRef.current;
    if (!video) return;
    if (stream) {
      video.srcObject = stream;
      video.play().catch(() => {});
    } else {
      video.srcObject = null;
    }
  }, [stream]);

  return (
    <div
      className="absolute bottom-[120px] left-3 z-[25] select-none"
      style={{ fontFamily: "inherit" }}
    >
      {/* Header bar — always visible as a toggle */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="flex items-center gap-1.5 px-2 py-1 w-full font-pixel"
        style={{
          background: "rgba(6,4,14,0.97)",
          border: "2px solid #CC0000",
          borderBottom: collapsed ? "2px solid #CC0000" : "none",
          boxShadow: "2px 2px 0 rgba(204,0,0,0.45)",
          color: "#FFDE00",
          fontSize: 8,
          letterSpacing: "0.05em",
          cursor: "pointer",
        }}
      >
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: 0,
            flexShrink: 0,
            background: modelError ? "#f87171" : isReady ? "#34d399" : "#6b7280",
            display: "inline-block",
          }}
        />
        <span style={{ flex: 1, textAlign: "left" }}>GESTURE VISION</span>
        <span style={{ color: "rgba(255,222,0,0.5)", fontSize: 7 }}>
          {collapsed ? "▲" : "▼"}
        </span>
      </button>

      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, scaleY: 0, originY: 0 }}
            animate={{ opacity: 1, scaleY: 1 }}
            exit={{ opacity: 0, scaleY: 0, originY: 0 }}
            transition={{ duration: 0.15 }}
          >
            <div
              style={{
                background: "rgba(6,4,14,0.95)",
                border: "2px solid #CC0000",
                borderTop: "none",
                boxShadow: "2px 2px 0 rgba(204,0,0,0.45)",
                width: 120,
                overflow: "hidden",
              }}
            >
              {/* Camera PiP */}
              <div style={{ position: "relative", width: 120, height: 90 }}>
                <video
                  ref={videoPreviewRef}
                  playsInline
                  muted
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    transform: "scaleX(-1)",
                    display: "block",
                    opacity: isReady ? 0.85 : 0.3,
                  }}
                />
                {/* Scanlines */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                    backgroundImage:
                      "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.12) 2px, rgba(0,0,0,0.12) 3px)",
                  }}
                />
                {!isReady && !modelError && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "rgba(6,4,14,0.7)",
                    }}
                  >
                    <span
                      className="font-pixel animate-pulse"
                      style={{
                        fontSize: 7,
                        color: "rgba(255,222,0,0.6)",
                        textAlign: "center",
                        padding: "0 6px",
                      }}
                    >
                      CONNECTING…
                    </span>
                  </div>
                )}
                {modelError && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "rgba(6,4,14,0.75)",
                    }}
                  >
                    <span
                      className="font-pixel"
                      style={{ fontSize: 7, color: "#f87171", textAlign: "center", padding: "0 6px" }}
                    >
                      VISION ERR
                    </span>
                  </div>
                )}
              </div>

              {/* Gesture readout */}
              <div
                style={{
                  borderTop: "1px solid rgba(204,0,0,0.4)",
                  padding: "4px 6px",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <span style={{ fontSize: 14, lineHeight: 1 }}>{display.icon}</span>
                <div style={{ flex: 1, overflow: "hidden" }}>
                  <span
                    className="font-pixel"
                    style={{
                      fontSize: 7,
                      color: display.color,
                      letterSpacing: "0.04em",
                      display: "block",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {display.label}
                  </span>
                  {gesture && (
                    <span
                      className="font-pixel"
                      style={{
                        fontSize: 6,
                        color: "rgba(255,240,176,0.45)",
                        letterSpacing: "0.02em",
                      }}
                    >
                      {Math.round(gesture.confidence * 100)}% CONF
                    </span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default GestureOverlay;
