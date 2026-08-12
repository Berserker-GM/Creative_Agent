import { GeminiProvider } from "@/lib/ai/gemini-provider";
import type { AIProvider } from "@/lib/ai/types";

let cachedProvider: AIProvider | null = null;

/**
 * Returns the configured AI provider.
 * Milestone 03: Gemini only.
 */
export function getAIProvider(): AIProvider {
  if (!cachedProvider) {
    cachedProvider = new GeminiProvider();
  }
  return cachedProvider;
}
