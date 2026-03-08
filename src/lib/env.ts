/**
 * Central env config. Import from here — never read process.env directly in app code.
 * All keys are optional at dev time; missing keys trigger graceful fallbacks.
 */

export const env = {
  // Overshoot — real-time VLM on live video (scene analysis + gesture detection)
  // NEXT_PUBLIC_ prefix makes it available in the browser bundle.
  OVERSHOOT_API_KEY: process.env.NEXT_PUBLIC_OVERSHOOT_API_KEY ?? "",

  // Gemini 2.0 Flash
  GEMINI_API_KEY: process.env.GEMINI_API_KEY ?? "",

  // Lyria 2 (Vertex AI)
  LYRIA_PROJECT_ID: process.env.LYRIA_PROJECT_ID ?? "",
  LYRIA_LOCATION: process.env.LYRIA_LOCATION ?? "us-central1",
  LYRIA_ACCESS_TOKEN: process.env.LYRIA_ACCESS_TOKEN ?? "",

  // NanoBanana visual generation
  NANOBANANA_API_KEY: process.env.NANOBANANA_API_KEY ?? "",
  NANOBANANA_API_URL: process.env.NANOBANANA_API_URL ?? "https://api.nanobanana.ai/v1",

  // App
  NODE_ENV: process.env.NODE_ENV ?? "development",
  isDev: process.env.NODE_ENV !== "production",

  // Demo flag — NEXT_PUBLIC_ prefix makes it available in the browser bundle.
  // "true" (default) = mock data only; "false" = live API calls.
  DEMO_MODE: process.env.NEXT_PUBLIC_DEMO_MODE !== "false",
} as const;

/** Returns true if a given API is configured */
export const isApiAvailable = {
  overshoot: () => env.OVERSHOOT_API_KEY.length > 0,
  gemini: () => env.GEMINI_API_KEY.length > 0,
  lyria: () =>
    env.LYRIA_PROJECT_ID.length > 0 &&
    env.LYRIA_ACCESS_TOKEN.length > 0,
  // Image generation works with either the dedicated key or the Gemini key (which has Imagen 3 access)
  nanobanana: () => env.NANOBANANA_API_KEY.length > 0 || env.GEMINI_API_KEY.length > 0,
};
