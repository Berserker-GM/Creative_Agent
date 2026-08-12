import { getAIProvider } from "@/lib/ai/provider";
import { zodToGeminiJsonSchema } from "@/lib/ai/json-schema";
import { GeminiProviderError } from "@/lib/ai/gemini-provider";
import {
  buildVisualAssetPlanUserPrompt,
  VISUAL_ASSET_PLAN_SYSTEM_PROMPT,
} from "@/lib/agents/visual-asset-plan/prompt";
import type { CreativeDirection } from "@/lib/schemas/creative-direction";
import type { DesignGenome } from "@/lib/schemas/design-genome";
import type { ProjectContext } from "@/lib/schemas/project-context";
import type { ProductUnderstanding } from "@/lib/schemas/product-understanding";
import type { ReferenceAnalysis } from "@/lib/schemas/reference-analysis";
import {
  VisualAssetPlanSchema,
  type VisualAssetPlan,
} from "@/lib/schemas/visual-asset-plan";

export class VisualAssetPlanAgentError extends Error {
  readonly code: "CONFIG" | "PROVIDER" | "OUTPUT_INVALID" | "INPUT";

  constructor(
    code: "CONFIG" | "PROVIDER" | "OUTPUT_INVALID" | "INPUT",
    message: string,
  ) {
    super(message);
    this.name = "VisualAssetPlanAgentError";
    this.code = code;
  }
}

export type RunVisualAssetPlanInput = {
  projectContext: ProjectContext;
  productUnderstanding: ProductUnderstanding;
  creativeDirection: CreativeDirection;
  designGenome: DesignGenome;
  referenceAnalyses?: ReferenceAnalysis[];
};

function createPlanId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `asset-plan-${Date.now().toString(36)}`;
}

function ensureAssetIds(plan: VisualAssetPlan): VisualAssetPlan {
  const seen = new Set<string>();

  const assets = plan.assets.map((asset, index) => {
    let id = asset.id?.trim() || `asset-${index + 1}`;
    if (seen.has(id)) {
      id = `${id}-${index + 1}`;
    }
    seen.add(id);
    return { ...asset, id };
  });

  return { ...plan, assets };
}

/**
 * Visual Asset Plan Agent
 *
 * ProjectContext + ProductUnderstanding + CreativeDirection + DesignGenome
 * (+ optional ReferenceAnalysis[]) → Gemini → Zod → VisualAssetPlan
 */
export async function runVisualAssetPlanAgent(
  input: RunVisualAssetPlanInput,
): Promise<VisualAssetPlan> {
  const provider = getAIProvider();

  let rawText: string;
  try {
    const result = await provider.generateStructured({
      systemInstruction: VISUAL_ASSET_PLAN_SYSTEM_PROMPT,
      userPrompt: buildVisualAssetPlanUserPrompt({
        projectContext: input.projectContext,
        productUnderstanding: input.productUnderstanding,
        creativeDirection: input.creativeDirection,
        designGenome: input.designGenome,
        referenceAnalyses: input.referenceAnalyses,
      }),
      responseJsonSchema: zodToGeminiJsonSchema(VisualAssetPlanSchema),
    });
    rawText = result.text;
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("Gemini API key is not configured")
    ) {
      throw new VisualAssetPlanAgentError("CONFIG", error.message);
    }

    if (error instanceof GeminiProviderError) {
      throw new VisualAssetPlanAgentError("PROVIDER", error.message);
    }

    throw new VisualAssetPlanAgentError(
      "PROVIDER",
      "The visual asset plan request failed.",
    );
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(rawText);
  } catch {
    console.error("[visual-asset-plan-agent] Model returned non-JSON text");
    throw new VisualAssetPlanAgentError(
      "OUTPUT_INVALID",
      "The model returned malformed JSON.",
    );
  }

  const validated = VisualAssetPlanSchema.safeParse(parsedJson);
  if (!validated.success) {
    console.error(
      "[visual-asset-plan-agent] Zod validation failed",
      validated.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    );
    throw new VisualAssetPlanAgentError(
      "OUTPUT_INVALID",
      "The model response did not match the VisualAssetPlan schema.",
    );
  }

  const plan = ensureAssetIds(validated.data);

  return {
    ...plan,
    id: plan.id?.trim() || createPlanId(),
    creativeDirectionId: input.creativeDirection.id,
    designGenomeId: input.designGenome.id,
  };
}
