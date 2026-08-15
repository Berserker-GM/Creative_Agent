import { NextResponse } from "next/server";
import { isImageProviderConfigured } from "@/lib/media/image/config";
import { compileImageGenerationPrompt } from "@/lib/media/image/generation-prompt";
import { getImageProvider } from "@/lib/media/image/provider";
import { ImageProviderError } from "@/lib/media/image/types";
import { CreativeDirectionSchema } from "@/lib/schemas/creative-direction";
import { DesignGenomeSchema } from "@/lib/schemas/design-genome";
import type { GeneratedImage } from "@/lib/schemas/generated-image";
import { ProjectContextSchema } from "@/lib/schemas/project-context";
import { ProductUnderstandingSchema } from "@/lib/schemas/product-understanding";
import { ReferenceAnalysisSchema } from "@/lib/schemas/reference-analysis";
import {
  PlannedVisualAssetSchema,
  VisualAssetPlanSchema,
} from "@/lib/schemas/visual-asset-plan";

export const runtime = "nodejs";
export const maxDuration = 120;

function errorResponse(status: number, error: string) {
  return NextResponse.json({ error }, { status });
}

function createId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `img-${Date.now().toString(36)}`;
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return errorResponse(400, "Request body must be valid JSON.");
  }

  if (!body || typeof body !== "object") {
    return errorResponse(400, "Request body must be a JSON object.");
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

  const planResult = VisualAssetPlanSchema.safeParse(record.visualAssetPlan);
  if (!planResult.success) {
    return errorResponse(400, "Invalid VisualAssetPlan.");
  }

  const assetResult = PlannedVisualAssetSchema.safeParse(record.visualAsset);
  if (!assetResult.success) {
    return errorResponse(400, "Invalid visualAsset.");
  }

  const assetInPlan = planResult.data.assets.some(
    (item) => item.id === assetResult.data.id,
  );
  if (!assetInPlan) {
    return errorResponse(400, "visualAsset must exist in visualAssetPlan.");
  }

  if (!["required", "recommended", "optional"].includes(assetResult.data.status)) {
    return errorResponse(
      400,
      "visualAsset status must be required, recommended, or optional.",
    );
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

  if (!isImageProviderConfigured()) {
    return errorResponse(
      503,
      "Image generation is not configured. Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN on the server.",
    );
  }

  const prompt = compileImageGenerationPrompt({
    projectContext: projectResult.data,
    productUnderstanding: understandingResult.data,
    creativeDirection: directionResult.data,
    designGenome: genomeResult.data,
    visualAssetPlan: planResult.data,
    visualAsset: assetResult.data,
    referenceAnalyses,
  });

  try {
    const provider = getImageProvider();
    const result = await provider.generate({ prompt, steps: 4 });

    const generatedImage: GeneratedImage = {
      id: createId(),
      assetId: assetResult.data.id,
      provider: result.provider,
      model: result.model,
      prompt,
      status: "ready",
      mimeType: result.mimeType,
      data: result.data,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({ generatedImage });
  } catch (error) {
    if (error instanceof ImageProviderError) {
      if (error.code === "CONFIG") {
        return errorResponse(503, error.message);
      }
      if (error.code === "RATE_LIMIT") {
        return errorResponse(429, error.message);
      }
      if (error.code === "INVALID") {
        return errorResponse(400, error.message);
      }
      return errorResponse(502, error.message);
    }

    if (
      error instanceof Error &&
      error.message.includes("Image generation is not configured")
    ) {
      return errorResponse(503, error.message);
    }

    console.error("[api/generate/image] Unexpected failure", {
      name: error instanceof Error ? error.name : typeof error,
      message: error instanceof Error ? error.message : "unknown error",
    });

    return errorResponse(500, "Unexpected server error while generating image.");
  }
}
