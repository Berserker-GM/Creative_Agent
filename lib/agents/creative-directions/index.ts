import { getAIProvider } from "@/lib/ai/provider";
import { zodToGeminiJsonSchema } from "@/lib/ai/json-schema";
import { GeminiProviderError } from "@/lib/ai/gemini-provider";
import {
  buildCreativeDirectionsUserPrompt,
  CREATIVE_DIRECTIONS_SYSTEM_PROMPT,
} from "@/lib/agents/creative-directions/prompt";
import {
  CreativeDirectionsResultSchema,
  type CreativeDirection,
} from "@/lib/schemas/creative-direction";
import type { ProjectContext } from "@/lib/schemas/project-context";
import type { ProductUnderstanding } from "@/lib/schemas/product-understanding";
import type { ReferenceAnalysis } from "@/lib/schemas/reference-analysis";

export class CreativeDirectionsAgentError extends Error {
  readonly code: "CONFIG" | "PROVIDER" | "OUTPUT_INVALID" | "INPUT";

  constructor(
    code: "CONFIG" | "PROVIDER" | "OUTPUT_INVALID" | "INPUT",
    message: string,
  ) {
    super(message);
    this.name = "CreativeDirectionsAgentError";
    this.code = code;
  }
}

export type RunCreativeDirectionsInput = {
  projectContext: ProjectContext;
  productUnderstanding: ProductUnderstanding;
  referenceAnalyses?: ReferenceAnalysis[];
};

function createDirectionId(index: number): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `direction-${index + 1}-${Date.now().toString(36)}`;
}

function ensureDirectionIds(
  directions: CreativeDirection[],
): CreativeDirection[] {
  const seen = new Set<string>();

  return directions.map((direction, index) => {
    let id = direction.id?.trim() || createDirectionId(index);
    if (seen.has(id)) {
      id = createDirectionId(index);
    }
    seen.add(id);
    return { ...direction, id };
  });
}

/**
 * Creative Directions Agent
 *
 * ProjectContext + ProductUnderstanding (+ optional ReferenceAnalysis[])
 * → prompt → AI provider → Zod → CreativeDirection[4]
 */
export async function runCreativeDirectionsAgent(
  input: RunCreativeDirectionsInput,
): Promise<CreativeDirection[]> {
  const provider = getAIProvider();

  let rawText: string;
  try {
    const result = await provider.generateStructured({
      systemInstruction: CREATIVE_DIRECTIONS_SYSTEM_PROMPT,
      userPrompt: buildCreativeDirectionsUserPrompt({
        projectContext: input.projectContext,
        productUnderstanding: input.productUnderstanding,
        referenceAnalyses: input.referenceAnalyses,
      }),
      responseJsonSchema: zodToGeminiJsonSchema(CreativeDirectionsResultSchema),
    });
    rawText = result.text;
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("Gemini API key is not configured")
    ) {
      throw new CreativeDirectionsAgentError("CONFIG", error.message);
    }

    if (error instanceof GeminiProviderError) {
      throw new CreativeDirectionsAgentError("PROVIDER", error.message);
    }

    throw new CreativeDirectionsAgentError(
      "PROVIDER",
      "The creative directions request failed.",
    );
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(rawText);
  } catch {
    console.error("[creative-directions-agent] Model returned non-JSON text");
    throw new CreativeDirectionsAgentError(
      "OUTPUT_INVALID",
      "The model returned malformed JSON.",
    );
  }

  // Accept either wrapped result or a bare array.
  const candidate =
    Array.isArray(parsedJson)
      ? { creativeDirections: parsedJson }
      : parsedJson;

  const validated = CreativeDirectionsResultSchema.safeParse(candidate);
  if (!validated.success) {
    console.error(
      "[creative-directions-agent] Zod validation failed",
      validated.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    );
    throw new CreativeDirectionsAgentError(
      "OUTPUT_INVALID",
      "The model response did not match the CreativeDirections schema.",
    );
  }

  return ensureDirectionIds(validated.data.creativeDirections);
}
