"use client";

import { useState } from "react";
import { MotionGenerationView } from "@/components/project/MotionGenerationView";
import type { CreativeDirection } from "@/lib/schemas/creative-direction";
import type { DesignGenome } from "@/lib/schemas/design-genome";
import {
  GeneratedImageSchema,
  type GeneratedImage,
} from "@/lib/schemas/generated-image";
import type { ProjectContext } from "@/lib/schemas/project-context";
import type { ProductUnderstanding } from "@/lib/schemas/product-understanding";
import type { ReferenceAnalysis } from "@/lib/schemas/reference-analysis";
import type {
  PlannedVisualAsset,
  VisualAssetPlan,
} from "@/lib/schemas/visual-asset-plan";

type ImageGenerationViewProps = {
  projectContext: ProjectContext;
  productUnderstanding: ProductUnderstanding;
  creativeDirection: CreativeDirection;
  designGenome: DesignGenome;
  visualAssetPlan: VisualAssetPlan;
  referenceAnalyses?: ReferenceAnalysis[];
  generatedByAssetId: Record<string, GeneratedImage>;
  selectedAssetId: string | null;
  onSelectAsset: (assetId: string) => void;
  onGenerated: (assetId: string, image: GeneratedImage) => void;
  onClearAssetImage: (assetId: string) => void;
};

function toDataUrl(image: GeneratedImage): string {
  return `data:${image.mimeType};base64,${image.data}`;
}

export function ImageGenerationView({
  projectContext,
  productUnderstanding,
  creativeDirection,
  designGenome,
  visualAssetPlan,
  referenceAnalyses = [],
  generatedByAssetId,
  selectedAssetId,
  onSelectAsset,
  onGenerated,
  onClearAssetImage,
}: ImageGenerationViewProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const assets = visualAssetPlan.assets.filter((asset) =>
    ["required", "recommended", "optional"].includes(asset.status),
  );

  const selectedAsset =
    assets.find((asset) => asset.id === selectedAssetId) ?? null;
  const generatedImage = selectedAsset
    ? (generatedByAssetId[selectedAsset.id] ?? null)
    : null;

  async function handleGenerate(asset: PlannedVisualAsset) {
    if (isGenerating) return;

    setIsGenerating(true);
    setError(null);
    onClearAssetImage(asset.id);

    try {
      const response = await fetch("/api/generate/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectContext,
          productUnderstanding,
          creativeDirection,
          designGenome,
          visualAssetPlan,
          visualAsset: asset,
          referenceAnalyses,
        }),
      });

      const payload: unknown = await response.json().catch(() => null);
      const errorMessage =
        payload &&
        typeof payload === "object" &&
        "error" in payload &&
        typeof (payload as { error: unknown }).error === "string"
          ? (payload as { error: string }).error
          : null;

      if (!response.ok) {
        setError(errorMessage || "Image generation request failed.");
        return;
      }

      const imagePayload =
        payload && typeof payload === "object" && "generatedImage" in payload
          ? (payload as { generatedImage: unknown }).generatedImage
          : null;

      const parsed = GeneratedImageSchema.safeParse(imagePayload);
      if (!parsed.success) {
        setError("Received an invalid generated image payload.");
        return;
      }

      onGenerated(asset.id, parsed.data);
    } catch {
      setError("Could not reach the image generation endpoint.");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="mt-6 space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Generated visual
        </p>
        <p className="mt-1 text-sm text-zinc-500">
          This image is generated from the Creative Agent&apos;s creative
          direction, design genome, and visual asset plan. One image at a time
          — session-only.
        </p>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Direction:{" "}
          <span className="font-medium text-zinc-800 dark:text-zinc-200">
            {creativeDirection.name}
          </span>
        </p>
      </div>

      {assets.length === 0 ? (
        <p className="text-sm text-zinc-500">
          This plan has no generatable assets.
        </p>
      ) : (
        <div className="space-y-3">
          {assets.map((asset) => {
            const selected = selectedAssetId === asset.id;
            return (
              <button
                key={asset.id}
                type="button"
                onClick={() => onSelectAsset(asset.id)}
                aria-pressed={selected}
                className={`w-full border px-4 py-3 text-left ${
                  selected
                    ? "border-zinc-900 dark:border-zinc-100"
                    : "border-zinc-200 dark:border-zinc-800"
                }`}
              >
                <p className="text-xs uppercase tracking-wide text-zinc-500">
                  {asset.status} · {asset.type}
                </p>
                <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  {asset.name}
                </p>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {asset.purpose}
                </p>
              </button>
            );
          })}
        </div>
      )}

      {selectedAsset ? (
        <div className="space-y-4 border-t border-zinc-200 pt-6 dark:border-zinc-800">
          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-500">
              Selected asset
            </p>
            <h3 className="mt-1 text-base font-semibold text-zinc-900 dark:text-zinc-50">
              {selectedAsset.name}
            </h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              {selectedAsset.purpose}
            </p>
          </div>

          <button
            type="button"
            disabled={isGenerating}
            onClick={() => {
              void handleGenerate(selectedAsset);
            }}
            className="rounded bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
          >
            {isGenerating ? "Generating…" : "Generate visual"}
          </button>

          {isGenerating ? (
            <p className="text-sm text-zinc-500">
              Generating one visual from your Creative Direction and Design
              Genome…
            </p>
          ) : null}

          {error ? (
            <p
              className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          {generatedImage ? (
            <>
              <figure className="overflow-hidden border border-zinc-200 dark:border-zinc-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={toDataUrl(generatedImage)}
                  alt={`${selectedAsset.name} generated visual`}
                  className="aspect-video w-full object-cover"
                />
                <figcaption className="space-y-1 p-3 text-xs text-zinc-500">
                  <p>
                    Status: {generatedImage.status} · {generatedImage.provider}/
                    {generatedImage.model}
                  </p>
                  <p className="font-mono">asset: {generatedImage.assetId}</p>
                </figcaption>
              </figure>

              <MotionGenerationView
                projectContext={projectContext}
                productUnderstanding={productUnderstanding}
                creativeDirection={creativeDirection}
                designGenome={designGenome}
                visualAssetPlan={visualAssetPlan}
                visualAsset={selectedAsset}
                generatedImage={generatedImage}
                referenceAnalyses={referenceAnalyses}
              />
            </>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-zinc-500">
          Select one planned asset to generate a visual.
        </p>
      )}
    </div>
  );
}
