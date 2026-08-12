import { NextResponse } from "next/server";
import {
  ProductUnderstandingAgentError,
  runProductUnderstandingAgent,
} from "@/lib/agents/product-understanding";
import { getGeminiApiKey } from "@/lib/ai/config";
import { ProjectContextSchema } from "@/lib/schemas/project-context";

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

  const projectResult = ProjectContextSchema.safeParse(body);
  if (!projectResult.success) {
    return errorResponse(
      400,
      "Invalid ProjectContext. Send a validated ProjectContext object as the JSON body.",
    );
  }

  if (!getGeminiApiKey()) {
    return errorResponse(
      503,
      "Gemini is not configured. Set GEMINI_API_KEY on the server.",
    );
  }

  try {
    const understanding = await runProductUnderstandingAgent(
      projectResult.data,
    );

    return NextResponse.json({
      productUnderstanding: understanding,
    });
  } catch (error) {
    if (error instanceof ProductUnderstandingAgentError) {
      if (error.code === "CONFIG") {
        return errorResponse(503, error.message);
      }
      if (error.code === "OUTPUT_INVALID") {
        return errorResponse(502, error.message);
      }
      return errorResponse(502, error.message);
    }

    console.error("[api/product-understanding] Unexpected failure", {
      name: error instanceof Error ? error.name : typeof error,
      message: error instanceof Error ? error.message : "unknown error",
    });

    return errorResponse(
      500,
      "Unexpected server error while generating product understanding.",
    );
  }
}
