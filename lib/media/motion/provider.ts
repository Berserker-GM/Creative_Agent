import {
  getMotionProviderUnavailableReason,
  isMotionProviderConfigured,
} from "@/lib/media/motion/config";
import {
  MotionProviderError,
  type MotionGenerateRequest,
  type MotionGenerateResult,
  type MotionProvider,
} from "@/lib/media/motion/types";

/**
 * Placeholder provider used when no free motion API is configured.
 * Keeps the ImageProvider-style boundary ready for a future implementation.
 */
export class UnavailableMotionProvider implements MotionProvider {
  readonly providerId = "unavailable";
  readonly modelId = "none";

  async generateMotion(
    request: MotionGenerateRequest,
  ): Promise<MotionGenerateResult> {
    void request;
    throw new MotionProviderError(
      "CONFIG",
      getMotionProviderUnavailableReason(),
      503,
    );
  }
}

let cachedProvider: MotionProvider | null = null;

/**
 * Returns the configured MotionProvider.
 * M09: no free provider selected — returns UnavailableMotionProvider.
 */
export function getMotionProvider(): MotionProvider {
  if (!isMotionProviderConfigured()) {
    return new UnavailableMotionProvider();
  }

  if (!cachedProvider) {
    // Future: swap in a real free provider implementation here.
    cachedProvider = new UnavailableMotionProvider();
  }

  return cachedProvider;
}
