/**
 * Generic image generation provider contract.
 * Application code depends on this — not Cloudflare-specific types.
 */

export type ImageGenerateRequest = {
  /** Coherent art-direction prompt compiled from Creative Agent outputs. */
  prompt: string;
  /** Optional deterministic seed. */
  seed?: number;
  /** Diffusion steps when supported by the model. */
  steps?: number;
};

export type ImageGenerateResult = {
  /** Raw base64 image payload (no data-URL prefix). */
  data: string;
  mimeType: string;
  provider: string;
  model: string;
};

export class ImageProviderError extends Error {
  readonly code: "CONFIG" | "RATE_LIMIT" | "PROVIDER" | "INVALID";
  readonly status?: number;

  constructor(
    code: "CONFIG" | "RATE_LIMIT" | "PROVIDER" | "INVALID",
    message: string,
    status?: number,
  ) {
    super(message);
    this.name = "ImageProviderError";
    this.code = code;
    this.status = status;
  }
}

export interface ImageProvider {
  readonly providerId: string;
  readonly modelId: string;
  generate(request: ImageGenerateRequest): Promise<ImageGenerateResult>;
}
