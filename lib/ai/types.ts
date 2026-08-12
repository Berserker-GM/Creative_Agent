/**
 * Minimal AI provider contract for structured generation.
 * Intentionally narrow — not a universal AI SDK facade.
 */

export type StructuredImagePart = {
  mimeType: string;
  /** Raw base64 payload (no data-URL prefix). */
  base64Data: string;
};

export type StructuredGenerationRequest = {
  systemInstruction: string;
  userPrompt: string;
  /** JSON Schema object passed to the provider's structured-output mode. */
  responseJsonSchema: Record<string, unknown>;
  /** Optional inline images for multimodal structured generation. */
  images?: StructuredImagePart[];
};

export type StructuredGenerationResult = {
  /** Raw model text (expected to be JSON). */
  text: string;
};

export interface AIProvider {
  generateStructured(
    request: StructuredGenerationRequest,
  ): Promise<StructuredGenerationResult>;
}
