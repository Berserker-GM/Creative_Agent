/**
 * Generic motion/video generation provider contract.
 * Application code depends on this — not provider-specific SDKs.
 */

import type { GeneratedImage } from "@/lib/schemas/generated-image";
import type { MotionPlan } from "@/lib/schemas/motion-plan";

export type MotionGenerateRequest = {
  motionPlan: MotionPlan;
  /** Optional still image from M08 (session base64). */
  sourceImage?: Pick<GeneratedImage, "data" | "mimeType" | "prompt">;
  /** Provider-agnostic generation brief from MotionPlan. */
  prompt: string;
};

export type MotionGenerateResult = {
  provider: string;
  model: string;
  /** Raw base64 video payload when available. */
  data?: string;
  mimeType?: string;
  /** Temporary playback URL when available (may expire). */
  playbackUrl?: string;
};

export class MotionProviderError extends Error {
  readonly code: "CONFIG" | "RATE_LIMIT" | "PROVIDER" | "UNSUPPORTED" | "INVALID";
  readonly status?: number;

  constructor(
    code: "CONFIG" | "RATE_LIMIT" | "PROVIDER" | "UNSUPPORTED" | "INVALID",
    message: string,
    status?: number,
  ) {
    super(message);
    this.name = "MotionProviderError";
    this.code = code;
    this.status = status;
  }
}

export interface MotionProvider {
  readonly providerId: string;
  readonly modelId: string;
  generateMotion(input: MotionGenerateRequest): Promise<MotionGenerateResult>;
}
