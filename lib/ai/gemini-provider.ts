import { GoogleGenAI } from "@google/genai";
import { assertGeminiConfigured, getGeminiModel } from "@/lib/ai/config";
import type {
  AIProvider,
  StructuredGenerationRequest,
  StructuredGenerationResult,
} from "@/lib/ai/types";

export class GeminiProviderError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "GeminiProviderError";
    this.status = status;
  }
}

export class GeminiProvider implements AIProvider {
  async generateStructured(
    request: StructuredGenerationRequest,
  ): Promise<StructuredGenerationResult> {
    const apiKey = assertGeminiConfigured();
    const model = getGeminiModel();
    const ai = new GoogleGenAI({ apiKey });

    const imageParts = (request.images ?? []).map((image) => ({
      inlineData: {
        mimeType: image.mimeType,
        data: image.base64Data,
      },
    }));

    const contents =
      imageParts.length > 0
        ? [...imageParts, request.userPrompt]
        : request.userPrompt;

    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction: request.systemInstruction,
          responseMimeType: "application/json",
          responseJsonSchema: request.responseJsonSchema,
        },
      });

      const text = response.text?.trim();
      if (!text) {
        throw new GeminiProviderError(
          "Gemini returned an empty response.",
          502,
        );
      }

      return { text };
    } catch (error) {
      if (error instanceof GeminiProviderError) {
        throw error;
      }

      const status =
        typeof error === "object" &&
        error !== null &&
        "status" in error &&
        typeof (error as { status: unknown }).status === "number"
          ? (error as { status: number }).status
          : undefined;

      console.error("[gemini-provider] generateStructured failed", {
        model,
        status,
        imageCount: imageParts.length,
        name: error instanceof Error ? error.name : typeof error,
        message: error instanceof Error ? error.message : "unknown error",
      });

      throw new GeminiProviderError(
        "Gemini request failed. Please try again later.",
        status,
      );
    }
  }
}
