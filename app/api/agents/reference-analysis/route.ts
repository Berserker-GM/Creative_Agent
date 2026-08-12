import { NextResponse } from "next/server";
import {
  ReferenceAnalysisAgentError,
  runReferenceAnalysisAgent,
} from "@/lib/agents/reference-analysis";
import { fileToValidatedReferenceImage } from "@/lib/agents/reference-analysis/image";
import { getGeminiApiKey } from "@/lib/ai/config";
import { ProjectContextSchema } from "@/lib/schemas/project-context";

export const runtime = "nodejs";

function errorResponse(status: number, error: string) {
  return NextResponse.json({ error }, { status });
}

export async function POST(request: Request) {
  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return errorResponse(400, "Request must be multipart/form-data.");
  }

  const projectContextRaw = formData.get("projectContext");
  const referenceIdRaw = formData.get("referenceId");
  const imageRaw = formData.get("image");

  if (typeof projectContextRaw !== "string" || !projectContextRaw.trim()) {
    return errorResponse(400, "projectContext is required as a JSON string.");
  }

  if (typeof referenceIdRaw !== "string" || !referenceIdRaw.trim()) {
    return errorResponse(400, "referenceId is required.");
  }

  let projectJson: unknown;
  try {
    projectJson = JSON.parse(projectContextRaw);
  } catch {
    return errorResponse(400, "projectContext must be valid JSON.");
  }

  const projectResult = ProjectContextSchema.safeParse(projectJson);
  if (!projectResult.success) {
    return errorResponse(400, "Invalid ProjectContext.");
  }

  if (!(imageRaw instanceof File)) {
    return errorResponse(400, "An image file is required.");
  }

  const imageResult = await fileToValidatedReferenceImage(imageRaw);
  if (!imageResult.success) {
    return errorResponse(400, imageResult.error);
  }

  if (!getGeminiApiKey()) {
    return errorResponse(
      503,
      "Gemini is not configured. Set GEMINI_API_KEY on the server.",
    );
  }

  try {
    const analysis = await runReferenceAnalysisAgent({
      projectContext: projectResult.data,
      referenceId: referenceIdRaw.trim(),
      image: imageResult.data,
    });

    return NextResponse.json({
      referenceAnalysis: analysis,
    });
  } catch (error) {
    if (error instanceof ReferenceAnalysisAgentError) {
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

    console.error("[api/reference-analysis] Unexpected failure", {
      name: error instanceof Error ? error.name : typeof error,
      message: error instanceof Error ? error.message : "unknown error",
    });

    return errorResponse(
      500,
      "Unexpected server error while analyzing the reference image.",
    );
  }
}
