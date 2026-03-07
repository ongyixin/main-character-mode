// NanoBanana visual asset generator wrapper.
// Falls back to emoji-based placeholders when API is unavailable.

import type {
  NanoBananaRequest,
  NanoBananaResponse,
  NanoBananaAssetType,
  IVisualGenerator,
} from "@/types";

const NANOBANANA_API_URL = process.env.NANOBANANA_API_URL ?? "";
const NANOBANANA_API_KEY = process.env.NANOBANANA_API_KEY ?? "";

// Fallback emojis per asset type — shown in UI when generation is unavailable
const FALLBACK_EMOJIS: Record<NanoBananaAssetType, string> = {
  character_portrait: "🎭",
  mission_card: "📋",
  recap_poster: "🎬",
  quest_item_icon: "⚔️",
};

export const visualGenerator: IVisualGenerator = {
  async generate(req: NanoBananaRequest): Promise<NanoBananaResponse> {
    if (NANOBANANA_API_URL && NANOBANANA_API_KEY) {
      try {
        const response = await fetch(`${NANOBANANA_API_URL}/generate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${NANOBANANA_API_KEY}`,
          },
          body: JSON.stringify({
            prompt: req.prompt,
            style: req.style ?? "cinematic",
            context: req.sessionContext,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          return {
            imageUrl: data.url,
            isFallback: false,
          };
        }
      } catch {
        // Fall through to fallback
      }
    }

    return {
      imageUrl: "",
      isFallback: true,
      fallbackEmoji: FALLBACK_EMOJIS[req.type],
    };
  },
};
