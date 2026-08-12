/**
 * Server-only Gemini configuration.
 * Never import this module from client components.
 */

/** Stable GA model with structured-output support (official Gemini docs). */
export const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

export function getGeminiModel(): string {
  const fromEnv = process.env.GEMINI_MODEL?.trim();
  return fromEnv || DEFAULT_GEMINI_MODEL;
}

/**
 * Official Gemini client libraries accept GEMINI_API_KEY or GOOGLE_API_KEY
 * (GOOGLE_API_KEY takes precedence when both are set).
 */
export function getGeminiApiKey(): string | null {
  const googleKey = process.env.GOOGLE_API_KEY?.trim();
  if (googleKey) return googleKey;

  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  if (geminiKey) return geminiKey;

  return null;
}

export function assertGeminiConfigured(): string {
  const key = getGeminiApiKey();
  if (!key) {
    throw new Error(
      "Gemini API key is not configured. Set GEMINI_API_KEY (or GOOGLE_API_KEY) on the server.",
    );
  }
  return key;
}
