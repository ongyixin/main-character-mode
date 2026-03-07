/**
 * Central env config. Import from here — never read process.env directly in app code.
 * All keys are optional at dev time; missing keys trigger graceful fallbacks.
 */

export const env = {
  // Gemini 2.0 Flash
  GEMINI_API_KEY: process.env.GEMINI_API_KEY ?? "",

  // Lyria adaptive music
  LYRIA_API_KEY: process.env.LYRIA_API_KEY ?? "",

  // NanoBanana visual generation
  NANOBANANA_API_KEY: process.env.NANOBANANA_API_KEY ?? "",
  NANOBANANA_API_URL: process.env.NANOBANANA_API_URL ?? "https://api.nanobanana.ai/v1",

  // App
  NODE_ENV: process.env.NODE_ENV ?? "development",
  isDev: process.env.NODE_ENV !== "production",
} as const;

/** Returns true if a given API is configured */
export const isApiAvailable = {
  gemini: () => env.GEMINI_API_KEY.length > 0,
  lyria: () => env.LYRIA_API_KEY.length > 0,
  nanobanana: () => env.NANOBANANA_API_KEY.length > 0,
};
