import { getAIProvider } from "@/lib/ai/provider";
import { zodToGeminiJsonSchema } from "@/lib/ai/json-schema";
import { GeminiProviderError } from "@/lib/ai/gemini-provider";
import {
  buildProductUnderstandingUserPrompt,
  PRODUCT_UNDERSTANDING_SYSTEM_PROMPT,
} from "@/lib/agents/product-understanding/prompt";
import type { ProjectContext } from "@/lib/schemas/project-context";
import {
  ProductUnderstandingSchema,
  type ProductUnderstanding,
} from "@/lib/schemas/product-understanding";

export class ProductUnderstandingAgentError extends Error {
  readonly code: "CONFIG" | "PROVIDER" | "OUTPUT_INVALID";

  constructor(
    code: "CONFIG" | "PROVIDER" | "OUTPUT_INVALID",
    message: string,
  ) {
    super(message);
    this.name = "ProductUnderstandingAgentError";
    this.code = code;
  }
}

/**
 * Product Understanding Agent
 *
 * ProjectContext → prompt → AI provider → Zod → ProductUnderstanding
 */
export async function runProductUnderstandingAgent(
  projectContext: ProjectContext,
): Promise<ProductUnderstanding> {
  const provider = getAIProvider();

  let rawText: string;
  try {
    const result = await provider.generateStructured({
      systemInstruction: PRODUCT_UNDERSTANDING_SYSTEM_PROMPT,
      userPrompt: buildProductUnderstandingUserPrompt(projectContext),
      responseJsonSchema: zodToGeminiJsonSchema(ProductUnderstandingSchema),
    });
    rawText = result.text;
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("Gemini API key is not configured")
    ) {
      throw new ProductUnderstandingAgentError("CONFIG", error.message);
    }

    if (error instanceof GeminiProviderError) {
      throw new ProductUnderstandingAgentError("PROVIDER", error.message);
    }

    throw new ProductUnderstandingAgentError(
      "PROVIDER",
      "The product understanding request failed.",
    );
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(rawText);
  } catch {
    console.error(
      "[product-understanding-agent] Model returned non-JSON text",
    );
    throw new ProductUnderstandingAgentError(
      "OUTPUT_INVALID",
      "The model returned malformed JSON.",
    );
  }

  const validated = ProductUnderstandingSchema.safeParse(parsedJson);
  if (!validated.success) {
    console.error(
      "[product-understanding-agent] Zod validation failed",
      validated.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    );
    throw new ProductUnderstandingAgentError(
      "OUTPUT_INVALID",
      "The model response did not match the ProductUnderstanding schema.",
    );
  }

  return validated.data;
}
