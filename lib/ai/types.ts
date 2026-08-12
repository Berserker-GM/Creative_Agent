/**
 * Minimal AI provider contract for structured generation.
 * Intentionally narrow — not a universal AI SDK facade.
 */

export type StructuredGenerationRequest = {
  systemInstruction: string;
  userPrompt: string;
  /** JSON Schema object passed to the provider's structured-output mode. */
  responseJsonSchema: Record<string, unknown>;
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
