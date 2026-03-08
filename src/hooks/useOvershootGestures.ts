"use client";

/**
 * useOvershootGestures — real-time hand gesture recognition via the Overshoot SDK.
 *
 * Replaces MediaPipe (useGestureDetection) with an Overshoot clip-mode stream on
 * the front-facing camera. Recognizes the same 7 gesture labels used by the app:
 *   thumbs_up  thumbs_down  victory  open_palm  closed_fist  pointing  i_love_you
 *
 * Trade-off vs MediaPipe: latency increases from ~100ms to ~500-1000ms, but
 * gesture labels in this app are used as context for dialogue interactions
 * (not as real-time input), so the slower cadence is acceptable.
 */

import { useEffect, useRef, useState } from "react";
import { RealtimeVision } from "overshoot";
import "@/lib/shared/suppressOvershootErrors";

const GESTURE_PROMPT =
  "Look at the hands in the frame. If a hand is visible and making a clear gesture, " +
  "identify it from this exact list: thumbs_up, thumbs_down, victory, open_palm, " +
  "closed_fist, pointing, i_love_you, none. " +
  "Return none if no hand is visible or the gesture is ambiguous. " +
  "Estimate your confidence from 0.0 to 1.0.";

const GESTURE_OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    gesture: {
      type: "string",
      enum: [
        "thumbs_up",
        "thumbs_down",
        "victory",
        "open_palm",
        "closed_fist",
        "pointing",
        "i_love_you",
        "none",
      ],
    },
    confidence: { type: "number" },
  },
  required: ["gesture", "confidence"],
};

export interface DetectedGesture {
  /** Normalized gesture label, e.g. "thumbs_up" */
  label: string;
  /** Detection confidence 0–1 */
  confidence: number;
  /** Unix timestamp of this detection */
  timestamp: number;
}

export interface UseOvershootGesturesReturn {
  /** Most recently detected gesture, or null when no gesture is present. */
  gesture: DetectedGesture | null;
  /** The front-camera MediaStream managed by Overshoot — use for PiP display. */
  mediaStream: MediaStream | null;
  isReady: boolean;
  /** Non-null on fatal stream errors. */
  error: string | null;
}

export function useOvershootGestures(enabled = true): UseOvershootGesturesReturn {
  const [gesture, setGesture] = useState<DetectedGesture | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const visionRef = useRef<RealtimeVision | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const apiKey = process.env.NEXT_PUBLIC_OVERSHOOT_API_KEY;
    if (!apiKey) {
      setError("NEXT_PUBLIC_OVERSHOOT_API_KEY is not set");
      return;
    }

    let cancelled = false;
    let retryTimeout: NodeJS.Timeout | null = null;
    let retryCount = 0;
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 2000; // 2 seconds

    const createVision = () => {
      const vision = new RealtimeVision({
        apiKey,
        // 4B is the lowest-latency Qwen model — sufficient for 7-class gesture classification
        model: "Qwen/Qwen3.5-4B",
        prompt: GESTURE_PROMPT,
        source: { type: "camera", cameraFacing: "user" },
        mode: "clip",
        clipProcessing: {
          clip_length_seconds: 1,
          delay_seconds: 0.5,
          target_fps: 6,
        },
        outputSchema: GESTURE_OUTPUT_SCHEMA,
        // Gesture response is tiny — cap tokens to minimize latency
        maxOutputTokens: 30,
        onResult: (result) => {
          if (!result.ok || cancelled) return;
          try {
            const data = JSON.parse(result.result) as {
              gesture: string;
              confidence: number;
            };
            if (data.gesture && data.gesture !== "none") {
              setGesture({
                label: data.gesture,
                confidence: data.confidence ?? 1,
                timestamp: Date.now(),
              });
            } else {
              setGesture(null);
            }
            // Reset retry count on successful result
            retryCount = 0;
          } catch {
            // Ignore individual parse failures
          }
        },
        onError: (err) => {
          if (cancelled) return;
          
          // Suppress WebSocket errors that are already logged by the library
          const errorMessage = err.message ?? "Overshoot gesture stream error";
          const isWebSocketError = errorMessage.toLowerCase().includes("websocket") || 
                                   err.name === "WebSocketError";
          
          if (!isWebSocketError) {
            console.error("[useOvershootGestures]", err);
          }
          
          setIsReady(false);
          
          // Retry on WebSocket errors if we haven't exceeded max retries
          if (isWebSocketError && retryCount < MAX_RETRIES && !cancelled) {
            retryCount++;
            if (retryTimeout) {
              clearTimeout(retryTimeout);
            }
            retryTimeout = setTimeout(() => {
              if (!cancelled) {
                const currentVision = visionRef.current;
                if (currentVision) {
                  currentVision.stop().catch(() => {});
                }
                visionRef.current = null;
                createVision();
              }
            }, RETRY_DELAY);
            setError(`Connection error (retrying ${retryCount}/${MAX_RETRIES})...`);
          } else {
            setError(errorMessage);
          }
        },
      });

      visionRef.current = vision;

      vision
        .start()
        .then(() => {
          if (cancelled) {
            vision.stop().catch(() => {});
            return;
          }
          const stream = vision.getMediaStream();
          if (stream) setMediaStream(stream);
          setIsReady(true);
          setError(null);
          retryCount = 0; // Reset on successful start
        })
        .catch((err: Error) => {
          if (cancelled) return;
          
          const errorMessage = err.message ?? "Failed to start gesture stream";
          const isWebSocketError = errorMessage.toLowerCase().includes("websocket");
          
          if (!isWebSocketError) {
            console.error("[useOvershootGestures] start failed:", err);
          }
          
          // Retry on WebSocket errors
          if (isWebSocketError && retryCount < MAX_RETRIES && !cancelled) {
            retryCount++;
            if (retryTimeout) {
              clearTimeout(retryTimeout);
            }
            retryTimeout = setTimeout(() => {
              if (!cancelled) {
                const currentVision = visionRef.current;
                if (currentVision) {
                  currentVision.stop().catch(() => {});
                }
                visionRef.current = null;
                createVision();
              }
            }, RETRY_DELAY);
            setError(`Connection error (retrying ${retryCount}/${MAX_RETRIES})...`);
          } else {
            setError(errorMessage);
          }
        });
    };

    createVision();

    return () => {
      cancelled = true;
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
      const vision = visionRef.current;
      visionRef.current = null;
      if (vision) {
        vision.stop().catch(() => {});
      }
      setIsReady(false);
      setMediaStream(null);
      setGesture(null);
    };
  }, [enabled]);

  return { gesture, mediaStream, isReady, error };
}
