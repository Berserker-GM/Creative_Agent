import { getAIProvider } from "@/lib/ai/provider";
import { zodToGeminiJsonSchema } from "@/lib/ai/json-schema";
import { GeminiProviderError } from "@/lib/ai/gemini-provider";
import {
  buildDesignGenomeUserPrompt,
  DESIGN_GENOME_SYSTEM_PROMPT,
} from "@/lib/agents/design-genome/prompt";
import {
  DesignGenomeSchema,
  type DesignGenome,
} from "@/lib/schemas/design-genome";
import type { CreativeDirection } from "@/lib/schemas/creative-direction";
import type { ProjectContext } from "@/lib/schemas/project-context";
import type { ProductUnderstanding } from "@/lib/schemas/product-understanding";
import type { ReferenceAnalysis } from "@/lib/schemas/reference-analysis";

export class DesignGenomeAgentError extends Error {
  readonly code: "CONFIG" | "PROVIDER" | "OUTPUT_INVALID" | "INPUT";

  constructor(
    code: "CONFIG" | "PROVIDER" | "OUTPUT_INVALID" | "INPUT",
    message: string,
  ) {
    super(message);
    this.name = "DesignGenomeAgentError";
    this.code = code;
  }
}

export type RunDesignGenomeInput = {
  projectContext: ProjectContext;
  productUnderstanding: ProductUnderstanding;
  creativeDirection: CreativeDirection;
  referenceAnalyses?: ReferenceAnalysis[];
};

function createGenomeId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `genome-${Date.now().toString(36)}`;
}

/**
 * Design Genome Agent
 *
 * ProjectContext + ProductUnderstanding + selected CreativeDirection
 * (+ optional ReferenceAnalysis[]) → prompt → Gemini → Zod → DesignGenome
 */
export async function runDesignGenomeAgent(
  input: RunDesignGenomeInput,
): Promise<DesignGenome> {
  const provider = getAIProvider();

  let rawText: string;
  try {
    const result = await provider.generateStructured({
      systemInstruction: DESIGN_GENOME_SYSTEM_PROMPT,
      userPrompt: buildDesignGenomeUserPrompt({
        projectContext: input.projectContext,
        productUnderstanding: input.productUnderstanding,
        creativeDirection: input.creativeDirection,
        referenceAnalyses: input.referenceAnalyses,
      }),
      responseJsonSchema: zodToGeminiJsonSchema(DesignGenomeSchema),
    });
    rawText = result.text;
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("Gemini API key is not configured")
    ) {
      throw new DesignGenomeAgentError("CONFIG", error.message);
    }

    if (error instanceof GeminiProviderError) {
      throw new DesignGenomeAgentError("PROVIDER", error.message);
    }

    throw new DesignGenomeAgentError(
      "PROVIDER",
      "The design genome request failed.",
    );
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(rawText);
  } catch {
    console.error("[design-genome-agent] Model returned non-JSON text");
    throw new DesignGenomeAgentError(
      "OUTPUT_INVALID",
      "The model returned malformed JSON.",
    );
  }

  const validated = DesignGenomeSchema.safeParse(parsedJson);
  if (!validated.success) {
    console.error(
      "[design-genome-agent] Zod validation failed",
      validated.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    );
    throw new DesignGenomeAgentError(
      "OUTPUT_INVALID",
      "The model response did not match the DesignGenome schema.",
    );
  }

  const genome = validated.data;
  const id = genome.id?.trim() || createGenomeId();

  return {
    ...genome,
    id,
    creativeDirectionId: input.creativeDirection.id,
  };
}
