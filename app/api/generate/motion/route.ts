import { NextResponse } from "next/server";
import { getMotionProviderUnavailableReason } from "@/lib/media/motion/config";
import { compileMotionPlan } from "@/lib/media/motion/motion-compiler";
import { getMotionProvider } from "@/lib/media/motion/provider";
import { MotionProviderError } from "@/lib/media/motion/types";
import { CreativeDirectionSchema } from "@/lib/schemas/creative-direction";
import { DesignGenomeSchema } from "@/lib/schemas/design-genome";
import { GeneratedImageSchema } from "@/lib/schemas/generated-image";
import type { GeneratedMotion } from "@/lib/schemas/generated-motion";
import { ProjectContextSchema } from "@/lib/schemas/project-context";
import { ProductUnderstandingSchema } from "@/lib/schemas/product-understanding";
import { ReferenceAnalysisSchema } from "@/lib/schemas/reference-analysis";
import {
  PlannedVisualAssetSchema,
  VisualAssetPlanSchema,
} from "@/lib/schemas/visual-asset-plan";

export const runtime = "nodejs";
export const maxDuration = 120;

function errorResponse(
  status: number,
  error: string,
  extra?: Record<string, unknown>,
) {
  return NextResponse.json({ error, ...extra }, { status });
}

function createId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `motion-${Date.now().toString(36)}`;
}

function sanitizeProviderMessage(message: string): string {
  return message
    .replace(/Bearer\s+[A-Za-z0-9._\-]+/gi, "Bearer [REDACTED]")
    .replace(/api[_-]?key[=:]\s*\S+/gi, "api_key=[REDACTED]")
    .replace(/CLOUDFLARE_[A-Z_]+=\S+/gi, "[REDACTED]")
    .replace(/sk-[A-Za-z0-9]+/g, "[REDACTED]");
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

  const imageResult = GeneratedImageSchema.safeParse(record.generatedImage);
  if (!imageResult.success) {
    return errorResponse(400, "Invalid GeneratedImage.");
  }

  const assetInPlan = planResult.data.assets.some(
    (item) => item.id === assetResult.data.id,
  );
  if (!assetInPlan) {
    return errorResponse(400, "visualAsset must exist in visualAssetPlan.");
  }

  if (imageResult.data.assetId !== assetResult.data.id) {
    return errorResponse(400, "generatedImage.assetId must match visualAsset.id.");
  }

  if (directionResult.data.id !== genomeResult.data.creativeDirectionId) {
    return errorResponse(
      400,
      "creativeDirection.id must match designGenome.creativeDirectionId.",
    );
  }

  if (planResult.data.creativeDirectionId !== directionResult.data.id) {
    return errorResponse(
      400,
      "visualAssetPlan.creativeDirectionId must match creativeDirection.id.",
    );
  }

  if (planResult.data.designGenomeId !== genomeResult.data.id) {
    return errorResponse(
      400,
      "visualAssetPlan.designGenomeId must match designGenome.id.",
    );
  }

  if (record.referenceAnalyses !== undefined) {
    if (!Array.isArray(record.referenceAnalyses)) {
      return errorResponse(400, "referenceAnalyses must be an array when provided.");
    }

    for (const [index, item] of record.referenceAnalyses.entries()) {
      const parsed = ReferenceAnalysisSchema.safeParse(item);
      if (!parsed.success) {
        return errorResponse(
          400,
          `Invalid ReferenceAnalysis at index ${index}.`,
        );
      }
    }
  }

  const motionPlan = compileMotionPlan({
    projectContext: projectResult.data,
    productUnderstanding: understandingResult.data,
    creativeDirection: directionResult.data,
    designGenome: genomeResult.data,
    visualAssetPlan: planResult.data,
    visualAsset: assetResult.data,
    generatedImage: imageResult.data,
  });

  if (!motionPlan.requiresGeneration) {
    const generatedMotion: GeneratedMotion = {
      id: createId(),
      motionPlanId: motionPlan.id,
      assetId: motionPlan.assetId,
      provider: "none",
      model: "none",
      status: "skipped",
      data: "",
      mimeType: "",
      playbackUrl: "",
      message: motionPlan.skipReason || "Video generation is not appropriate for this asset.",
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({ motionPlan, generatedMotion });
  }

  try {
    const provider = getMotionProvider();
    const result = await provider.generateMotion({
      motionPlan,
      sourceImage: {
        data: imageResult.data.data,
        mimeType: imageResult.data.mimeType,
        prompt: imageResult.data.prompt,
      },
      prompt: motionPlan.generationBrief,
    });

    const generatedMotion: GeneratedMotion = {
      id: createId(),
      motionPlanId: motionPlan.id,
      assetId: motionPlan.assetId,
      provider: result.provider,
      model: result.model,
      status: "ready",
      data: result.data ?? "",
      mimeType: result.mimeType ?? "",
      playbackUrl: result.playbackUrl ?? "",
      message: "Motion generated from the Creative Agent visual system.",
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({ motionPlan, generatedMotion });
  } catch (error) {
    if (error instanceof MotionProviderError) {
      const safeMessage = sanitizeProviderMessage(error.message);

      if (error.code === "CONFIG") {
        return errorResponse(503, safeMessage || getMotionProviderUnavailableReason(), {
          motionPlan,
        });
      }
      if (error.code === "RATE_LIMIT") {
        return errorResponse(429, safeMessage, { motionPlan });
      }
      if (error.code === "INVALID" || error.code === "UNSUPPORTED") {
        return errorResponse(400, safeMessage, { motionPlan });
      }
      return errorResponse(502, safeMessage, { motionPlan });
    }

    console.error("[api/generate/motion] Unexpected failure", {
      name: error instanceof Error ? error.name : typeof error,
      message: error instanceof Error ? error.message : "unknown error",
    });

    return errorResponse(
      500,
      "Unexpected server error while generating motion.",
      { motionPlan },
    );
  }
}
