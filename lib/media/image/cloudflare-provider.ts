import {
  assertImageProviderConfigured,
  getCloudflareImageModel,
} from "@/lib/media/image/config";
import {
  ImageProviderError,
  type ImageGenerateRequest,
  type ImageGenerateResult,
  type ImageProvider,
} from "@/lib/media/image/types";

/**
 * Cloudflare Workers AI image provider.
 * Initial model: @cf/black-forest-labs/flux-1-schnell
 *
 * Cloudflare-specific details stay here — the rest of the app uses ImageProvider.
 */
export class CloudflareImageProvider implements ImageProvider {
  readonly providerId = "cloudflare";

  get modelId(): string {
    return getCloudflareImageModel();
  }

  async generate(
    request: ImageGenerateRequest,
  ): Promise<ImageGenerateResult> {
    const { accountId, apiToken, model } = assertImageProviderConfigured();
    const prompt = request.prompt.trim();

    if (!prompt) {
      throw new ImageProviderError("INVALID", "Image prompt is empty.");
    }

    const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          steps: request.steps ?? 4,
          ...(typeof request.seed === "number" ? { seed: request.seed } : {}),
        }),
      });
    } catch (error) {
      console.error("[cloudflare-image-provider] network failure", {
        name: error instanceof Error ? error.name : typeof error,
        message: error instanceof Error ? error.message : "unknown error",
      });
      throw new ImageProviderError(
        "PROVIDER",
        "Image generation request failed.",
      );
    }

    const rawText = await response.text();

    if (response.status === 429) {
      throw new ImageProviderError(
        "RATE_LIMIT",
        "Image generation rate limit reached. Try again later.",
        429,
      );
    }

    if (!response.ok) {
      console.error("[cloudflare-image-provider] provider failure", {
        status: response.status,
        // Do not log full bodies that might include request auth context.
        bodyPreview: rawText.slice(0, 300),
      });
      throw new ImageProviderError(
        "PROVIDER",
        "Image generation failed. Please try again later.",
        response.status >= 500 ? 502 : response.status,
      );
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      throw new ImageProviderError(
        "PROVIDER",
        "Image provider returned an invalid response.",
        502,
      );
    }

    const imageBase64 = extractImageBase64(parsed);
    if (!imageBase64) {
      console.error("[cloudflare-image-provider] missing image payload");
      throw new ImageProviderError(
        "PROVIDER",
        "Image provider returned no image data.",
        502,
      );
    }

    return {
      data: imageBase64,
      mimeType: "image/jpeg",
      provider: this.providerId,
      model,
    };
  }
}

function extractImageBase64(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;

  const record = payload as Record<string, unknown>;

  // Workers AI REST: { success, result: { image } }
  if (record.result && typeof record.result === "object") {
    const result = record.result as Record<string, unknown>;
    if (typeof result.image === "string" && result.image.trim()) {
      return result.image.trim();
    }
  }

  // Binding-style / alternate: { image }
  if (typeof record.image === "string" && record.image.trim()) {
    return record.image.trim();
  }

  return null;
}
