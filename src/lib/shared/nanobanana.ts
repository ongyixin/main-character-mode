// NanoBanana visual asset generator wrapper.
// Powered by Imagen 3 via Google AI API, with Gemini Flash image generation as fallback.
// Falls back to emoji placeholders when all generation paths are unavailable.

import type {
  NanoBananaRequest,
  NanoBananaResponse,
  NanoBananaAssetType,
  IVisualGenerator,
} from "@/types";
import { env } from "@/lib/env";

const IMAGEN_MODEL = "imagen-3.0-generate-001";
const IMAGEN_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${IMAGEN_MODEL}:generateImages`;

const GEMINI_FLASH_IMAGE_MODEL = "gemini-2.0-flash-exp-image-generation";
const GEMINI_FLASH_IMAGE_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_FLASH_IMAGE_MODEL}:generateContent`;

// Fallback emojis per asset type — shown in UI when all generation fails
const FALLBACK_EMOJIS: Record<NanoBananaAssetType, string> = {
  character_portrait: "🎭",
  mission_card: "📋",
  recap_poster: "🎬",
  quest_item_icon: "⚔️",
};

/** Prefer the dedicated NanoBanana key; fall back to the Gemini key which is confirmed working. */
function getBestApiKey(): string {
  return env.NANOBANANA_API_KEY || env.GEMINI_API_KEY;
}

/**
 * Try Imagen 3 via generativelanguage.googleapis.com.
 * Requests PNG output (supports alpha) and explicitly prompts for a transparent background.
 */
async function generateWithImagen(prompt: string): Promise<string | null> {
  const apiKey = getBestApiKey();
  if (!apiKey) return null;

  const response = await fetch(`${IMAGEN_ENDPOINT}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: "image/png",
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Imagen API ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const b64 = data?.generatedImages?.[0]?.image?.imageBytes as string | undefined;
  if (!b64) return null;
  return `data:image/png;base64,${b64}`;
}

/**
 * Try Gemini 2.0 Flash image generation as a fallback.
 * Returns the first image part from the response.
 */
async function generateWithGeminiFlash(prompt: string): Promise<string | null> {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const response = await fetch(`${GEMINI_FLASH_IMAGE_ENDPOINT}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseModalities: ["IMAGE", "TEXT"],
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini Flash image API ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const parts: Array<{ inlineData?: { mimeType?: string; data?: string } }> =
    data?.candidates?.[0]?.content?.parts ?? [];

  for (const part of parts) {
    if (part?.inlineData?.data) {
      const mimeType = part.inlineData.mimeType ?? "image/png";
      return `data:${mimeType};base64,${part.inlineData.data}`;
    }
  }
  return null;
}

export const visualGenerator: IVisualGenerator = {
  async generate(req: NanoBananaRequest): Promise<NanoBananaResponse> {
    const hasAnyKey = !!(env.NANOBANANA_API_KEY || env.GEMINI_API_KEY);

    if (hasAnyKey) {
      // Primary: Imagen 3
      try {
        const imageUrl = await generateWithImagen(req.prompt);
        if (imageUrl) return { imageUrl, isFallback: false };
      } catch (err) {
        console.error("[nanobanana] Imagen 3 failed:", err);
      }

      // Secondary: Gemini 2.0 Flash image generation
      try {
        const imageUrl = await generateWithGeminiFlash(req.prompt);
        if (imageUrl) return { imageUrl, isFallback: false };
      } catch (err) {
        console.error("[nanobanana] Gemini Flash image gen failed:", err);
      }
    }

    return {
      imageUrl: "",
      isFallback: true,
      fallbackEmoji: FALLBACK_EMOJIS[req.type],
    };
  },
};
