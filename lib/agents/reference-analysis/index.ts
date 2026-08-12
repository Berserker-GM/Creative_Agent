import { getAIProvider } from "@/lib/ai/provider";
import { zodToGeminiJsonSchema } from "@/lib/ai/json-schema";
import { GeminiProviderError } from "@/lib/ai/gemini-provider";
import {
  buildReferenceAnalysisUserPrompt,
  REFERENCE_ANALYSIS_SYSTEM_PROMPT,
} from "@/lib/agents/reference-analysis/prompt";
import type { ValidatedReferenceImage } from "@/lib/agents/reference-analysis/image";
import type { ProjectContext } from "@/lib/schemas/project-context";
import {
  ReferenceAnalysisSchema,
  type ReferenceAnalysis,
} from "@/lib/schemas/reference-analysis";

export class ReferenceAnalysisAgentError extends Error {
  readonly code: "CONFIG" | "PROVIDER" | "OUTPUT_INVALID" | "INPUT";

  constructor(
    code: "CONFIG" | "PROVIDER" | "OUTPUT_INVALID" | "INPUT",
    message: string,
  ) {
    super(message);
    this.name = "ReferenceAnalysisAgentError";
    this.code = code;
  }
}

export type RunReferenceAnalysisInput = {
  projectContext: ProjectContext;
  referenceId: string;
  image: ValidatedReferenceImage;
};

/**
 * Image Reference Analysis Agent
 *
 * ProjectContext + image → prompt → AI provider → Zod → ReferenceAnalysis
 */
export async function runReferenceAnalysisAgent(
  input: RunReferenceAnalysisInput,
): Promise<ReferenceAnalysis> {
  if (!input.referenceId.trim()) {
    throw new ReferenceAnalysisAgentError(
      "INPUT",
      "referenceId is required.",
    );
  }

  if (!input.image.base64Data) {
    throw new ReferenceAnalysisAgentError(
      "INPUT",
      "Validated image data is missing.",
    );
  }

  const provider = getAIProvider();

  let rawText: string;
  try {
    const result = await provider.generateStructured({
      systemInstruction: REFERENCE_ANALYSIS_SYSTEM_PROMPT,
      userPrompt: buildReferenceAnalysisUserPrompt({
        projectContext: input.projectContext,
        referenceId: input.referenceId,
      }),
      responseJsonSchema: zodToGeminiJsonSchema(ReferenceAnalysisSchema),
      images: [
        {
          mimeType: input.image.mimeType,
          base64Data: input.image.base64Data,
        },
      ],
    });
    rawText = result.text;
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("Gemini API key is not configured")
    ) {
      throw new ReferenceAnalysisAgentError("CONFIG", error.message);
    }

    if (error instanceof GeminiProviderError) {
      throw new ReferenceAnalysisAgentError("PROVIDER", error.message);
    }

    throw new ReferenceAnalysisAgentError(
      "PROVIDER",
      "The reference analysis request failed.",
    );
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(rawText);
  } catch {
    console.error("[reference-analysis-agent] Model returned non-JSON text");
    throw new ReferenceAnalysisAgentError(
      "OUTPUT_INVALID",
      "The model returned malformed JSON.",
    );
  }

  const withId =
    typeof parsedJson === "object" && parsedJson !== null
      ? { ...parsedJson, referenceId: input.referenceId }
      : parsedJson;

  const validated = ReferenceAnalysisSchema.safeParse(withId);
  if (!validated.success) {
    console.error(
      "[reference-analysis-agent] Zod validation failed",
      validated.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    );
    throw new ReferenceAnalysisAgentError(
      "OUTPUT_INVALID",
      "The model response did not match the ReferenceAnalysis schema.",
    );
  }

  return validated.data;
}
