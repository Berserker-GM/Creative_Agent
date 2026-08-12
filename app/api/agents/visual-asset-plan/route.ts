import { NextResponse } from "next/server";
import {
  VisualAssetPlanAgentError,
  runVisualAssetPlanAgent,
} from "@/lib/agents/visual-asset-plan";
import { getGeminiApiKey } from "@/lib/ai/config";
import { CreativeDirectionSchema } from "@/lib/schemas/creative-direction";
import { DesignGenomeSchema } from "@/lib/schemas/design-genome";
import { ProjectContextSchema } from "@/lib/schemas/project-context";
import { ProductUnderstandingSchema } from "@/lib/schemas/product-understanding";
import { ReferenceAnalysisSchema } from "@/lib/schemas/reference-analysis";

export const runtime = "nodejs";

function errorResponse(status: number, error: string) {
  return NextResponse.json({ error }, { status });
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return errorResponse(400, "Request body must be valid JSON.");
  }

  if (!body || typeof body !== "object") {
    return errorResponse(
      400,
      "Request body must be an object with projectContext, productUnderstanding, creativeDirection, and designGenome.",
    );
  }

  const record = body as Record<string, unknown>;

  const projectResult = ProjectContextSchema.safeParse(record.projectContext);
  if (!projectResult.success) {
    return errorResponse(400, "Invalid ProjectContext.");
  }

  const understandingResult = ProductUnderstandingSchema.safeParse(
    record.productUnderstanding,
  );
  if (!understandingResult.success) {
    return errorResponse(400, "Invalid ProductUnderstanding.");
  }

  const directionResult = CreativeDirectionSchema.safeParse(
    record.creativeDirection,
  );
  if (!directionResult.success) {
    return errorResponse(400, "Invalid CreativeDirection.");
  }

  const genomeResult = DesignGenomeSchema.safeParse(record.designGenome);
  if (!genomeResult.success) {
    return errorResponse(400, "Invalid DesignGenome.");
  }

  let referenceAnalyses = undefined;
  if (record.referenceAnalyses !== undefined) {
    if (!Array.isArray(record.referenceAnalyses)) {
      return errorResponse(400, "referenceAnalyses must be an array when provided.");
    }

    const parsedReferences = [];
    for (const [index, item] of record.referenceAnalyses.entries()) {
      const parsed = ReferenceAnalysisSchema.safeParse(item);
      if (!parsed.success) {
        return errorResponse(
          400,
          `Invalid ReferenceAnalysis at index ${index}.`,
        );
      }
      parsedReferences.push(parsed.data);
    }
    referenceAnalyses = parsedReferences;
  }

  if (!getGeminiApiKey()) {
    return errorResponse(
      503,
      "Gemini is not configured. Set GEMINI_API_KEY on the server.",
    );
  }

  try {
    const visualAssetPlan = await runVisualAssetPlanAgent({
      projectContext: projectResult.data,
      productUnderstanding: understandingResult.data,
      creativeDirection: directionResult.data,
      designGenome: genomeResult.data,
      referenceAnalyses,
    });

    return NextResponse.json({ visualAssetPlan });
  } catch (error) {
    if (error instanceof VisualAssetPlanAgentError) {
      if (error.code === "CONFIG") {
        return errorResponse(503, error.message);
      }
      if (error.code === "INPUT") {
        return errorResponse(400, error.message);
      }
      if (error.code === "OUTPUT_INVALID") {
        return errorResponse(502, error.message);
      }
      return errorResponse(502, error.message);
    }

    console.error("[api/visual-asset-plan] Unexpected failure", {
      name: error instanceof Error ? error.name : typeof error,
      message: error instanceof Error ? error.message : "unknown error",
    });

    return errorResponse(
      500,
      "Unexpected server error while planning visual assets.",
    );
  }
}
