"use client";

import { useState } from "react";
import type { CreativeDirection } from "@/lib/schemas/creative-direction";
import type { DesignGenome } from "@/lib/schemas/design-genome";
import type { GeneratedImage } from "@/lib/schemas/generated-image";
import {
  GeneratedMotionSchema,
  type GeneratedMotion,
} from "@/lib/schemas/generated-motion";
import {
  MotionPlanSchema,
  type MotionPlan,
} from "@/lib/schemas/motion-plan";
import type { ProjectContext } from "@/lib/schemas/project-context";
import type { ProductUnderstanding } from "@/lib/schemas/product-understanding";
import type { ReferenceAnalysis } from "@/lib/schemas/reference-analysis";
import type {
  PlannedVisualAsset,
  VisualAssetPlan,
} from "@/lib/schemas/visual-asset-plan";

type MotionGenerationViewProps = {
  projectContext: ProjectContext;
  productUnderstanding: ProductUnderstanding;
  creativeDirection: CreativeDirection;
  designGenome: DesignGenome;
  visualAssetPlan: VisualAssetPlan;
  visualAsset: PlannedVisualAsset;
  generatedImage: GeneratedImage;
  referenceAnalyses?: ReferenceAnalysis[];
};

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="text-sm text-zinc-700 dark:text-zinc-300">{value}</p>
    </div>
  );
}

function toVideoSrc(motion: GeneratedMotion): string | null {
  if (motion.playbackUrl) return motion.playbackUrl;
  if (motion.data && motion.mimeType) {
    return `data:${motion.mimeType};base64,${motion.data}`;
  }
  return null;
}

export function MotionGenerationView({
  projectContext,
  productUnderstanding,
  creativeDirection,
  designGenome,
  visualAssetPlan,
  visualAsset,
  generatedImage,
  referenceAnalyses = [],
}: MotionGenerationViewProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [motionPlan, setMotionPlan] = useState<MotionPlan | null>(null);
  const [generatedMotion, setGeneratedMotion] =
    useState<GeneratedMotion | null>(null);

  async function handleGenerateMotion() {
    if (isGenerating) return;

    setIsGenerating(true);
    setError(null);
    setMotionPlan(null);
    setGeneratedMotion(null);

    try {
      const response = await fetch("/api/generate/motion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectContext,
          productUnderstanding,
          creativeDirection,
          designGenome,
          visualAssetPlan,
          visualAsset,
          generatedImage,
          referenceAnalyses,
        }),
      });

      const payload: unknown = await response.json().catch(() => null);
      const record =
        payload && typeof payload === "object"
          ? (payload as Record<string, unknown>)
          : null;

      const errorMessage =
        record && typeof record.error === "string" ? record.error : null;

      if (record?.motionPlan) {
        const parsedPlan = MotionPlanSchema.safeParse(record.motionPlan);
        if (parsedPlan.success) {
          setMotionPlan(parsedPlan.data);
        }
      }

      if (!response.ok) {
        setError(
          errorMessage ||
            "Motion generation is unavailable. The motion plan may still be shown above.",
        );
        return;
      }

      if (record?.generatedMotion) {
        const parsedMotion = GeneratedMotionSchema.safeParse(
          record.generatedMotion,
        );
        if (!parsedMotion.success) {
          setError("Received an invalid generated motion payload.");
          return;
        }
        setGeneratedMotion(parsedMotion.data);
      }
    } catch {
      setError("Could not reach the motion generation endpoint.");
    } finally {
      setIsGenerating(false);
    }
  }

  const videoSrc = generatedMotion ? toVideoSrc(generatedMotion) : null;

  return (
    <div className="mt-8 space-y-6 border-t border-zinc-200 pt-8 dark:border-zinc-800">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Motion from visual system
        </p>
        <h3 className="mt-1 text-base font-semibold text-zinc-900 dark:text-zinc-50">
          Translate this still into purposeful motion
        </h3>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          This motion was derived from the Creative Agent&apos;s visual system —
          Creative Direction, Design Genome motion/spatial behavior, and the
          selected asset — not a generic video playground prompt.
        </p>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Asset:{" "}
          <span className="font-medium text-zinc-800 dark:text-zinc-200">
            {visualAsset.name}
          </span>
          {" · "}
          Direction:{" "}
          <span className="font-medium text-zinc-800 dark:text-zinc-200">
            {creativeDirection.name}
          </span>
        </p>
      </div>

      <button
        type="button"
        disabled={isGenerating}
        onClick={() => {
          void handleGenerateMotion();
        }}
        className="rounded bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
      >
        {isGenerating ? "Deriving motion…" : "Generate motion plan"}
      </button>

      {isGenerating ? (
        <p className="text-sm text-zinc-500" aria-live="polite">
          Compiling motion from Design Genome and Creative Direction…
        </p>
      ) : null}

      {error ? (
        <p
          className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {motionPlan ? (
        <div className="space-y-4 border border-zinc-200 p-4 dark:border-zinc-800">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Motion plan
          </p>
          <Field label="Concept" value={motionPlan.concept} />
          <Field label="Motion language" value={motionPlan.motionLanguage} />
          <Field label="Purpose" value={motionPlan.purpose} />
          <Field label="Subject motion" value={motionPlan.subjectMotion} />
          <Field label="Camera motion" value={motionPlan.cameraMotion} />
          <Field
            label="Environment motion"
            value={motionPlan.environmentMotion}
          />
          <Field
            label="Transition behavior"
            value={motionPlan.transitionBehavior}
          />
          <Field label="Timing" value={motionPlan.timing} />
          <Field label="Intensity" value={motionPlan.intensity} />
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-zinc-500">
              Negative constraints
            </p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-zinc-700 dark:text-zinc-300">
              {motionPlan.negativeConstraints.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <Field
            label="Requires generation"
            value={
              motionPlan.requiresGeneration
                ? "Yes — video generation is meaningful for this asset."
                : `No — ${motionPlan.skipReason}`
            }
          />
        </div>
      ) : null}

      {generatedMotion ? (
        <div className="space-y-3 border border-zinc-200 p-4 dark:border-zinc-800">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Motion result
          </p>
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            Status:{" "}
            <span className="font-medium text-zinc-900 dark:text-zinc-50">
              {generatedMotion.status}
            </span>
          </p>
          {generatedMotion.message ? (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {generatedMotion.message}
            </p>
          ) : null}
          {videoSrc ? (
            <video
              controls
              className="max-h-[420px] w-full bg-zinc-100 dark:bg-zinc-900"
              src={videoSrc}
            >
              Your browser does not support video playback.
            </video>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
