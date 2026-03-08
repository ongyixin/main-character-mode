"use client";

/**
 * useOvershootScene — continuous real-time scene analysis via the Overshoot SDK.
 *
 * Replaces the manual "capture frame → POST /api/scan → Gemini analyzeImageJSON"
 * pipeline with a persistent Overshoot stream that emits SceneGraph JSON every ~2s.
 *
 * The hook also exposes the underlying MediaStream so Camera.tsx can display
 * the video feed without opening a second getUserMedia call.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { RealtimeVision } from "overshoot";
import "@/lib/shared/suppressOvershootErrors";
import type { SceneGraph, ActiveMode, StoryGenre } from "@/types";
import { sceneAnalysisPrompt } from "@/lib/shared/prompts";

const SCENE_OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    sceneType: { type: "string" },
    objects: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          label: { type: "string" },
          salience: { type: "number" },
          position: { type: "string", enum: ["left", "center", "right", "background"] },
          context: { type: "string" },
        },
        required: ["id", "label", "salience", "position", "context"],
      },
    },
    mood: { type: "string" },
    spatialContext: { type: "string" },
  },
  required: ["sceneType", "objects", "mood", "spatialContext"],
};

export interface UseOvershootSceneReturn {
  /** Latest parsed SceneGraph from Overshoot inference. */
  latestSceneGraph: SceneGraph | null;
  /** The camera MediaStream managed by Overshoot — pass to Camera.tsx as externalStream. */
  mediaStream: MediaStream | null;
  isStreaming: boolean;
  error: string | null;
}

export function useOvershootScene(
  mode: ActiveMode,
  genre?: StoryGenre,
): UseOvershootSceneReturn {
  const [latestSceneGraph, setLatestSceneGraph] = useState<SceneGraph | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const visionRef = useRef<RealtimeVision | null>(null);
  const promptRef = useRef(sceneAnalysisPrompt(mode, genre));

  // Keep prompt in sync if genre changes mid-session
  useEffect(() => {
    const updated = sceneAnalysisPrompt(mode, genre);
    if (visionRef.current && updated !== promptRef.current) {
      visionRef.current.updatePrompt(updated);
      promptRef.current = updated;
    }
  }, [mode, genre]);

  const handleResult = useCallback((result: { ok: boolean; result: string }) => {
    if (!result.ok) return;
    try {
      const data = JSON.parse(result.result) as SceneGraph;
      setLatestSceneGraph({ ...data, capturedAt: Date.now() });
    } catch {
      // Ignore individual parse failures — next result will overwrite
    }
  }, []);

  useEffect(() => {
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
        model: "Qwen/Qwen3.5-9B",
        prompt: promptRef.current,
        source: { type: "camera", cameraFacing: "user" },
        mode: "frame",
        frameProcessing: { interval_seconds: 2 },
        outputSchema: SCENE_OUTPUT_SCHEMA,
        onResult: (result) => {
          if (cancelled) return;
          handleResult(result);
          // Reset retry count on successful result
          retryCount = 0;
        },
        onError: (err) => {
          if (cancelled) return;
          
          // Suppress WebSocket errors that are already logged by the library
          const errorMessage = err.message ?? "Overshoot scene stream error";
          const isWebSocketError = errorMessage.toLowerCase().includes("websocket") || 
                                   err.name === "WebSocketError";
          
          if (!isWebSocketError) {
            console.error("[useOvershootScene]", err);
          }
          
          setIsStreaming(false);
          
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
          setIsStreaming(true);
          setError(null);
          retryCount = 0; // Reset on successful start
        })
        .catch((err: Error) => {
          if (cancelled) return;
          
          const errorMessage = err.message ?? "Failed to start Overshoot scene stream";
          const isWebSocketError = errorMessage.toLowerCase().includes("websocket");
          
          if (!isWebSocketError) {
            console.error("[useOvershootScene] start failed:", err);
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
      setIsStreaming(false);
      setMediaStream(null);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { latestSceneGraph, mediaStream, isStreaming, error };
}
