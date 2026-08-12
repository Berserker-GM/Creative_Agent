"use client";

import { useEffect, useMemo, useState } from "react";
import { ReferenceAnalysisView } from "@/components/project/ReferenceAnalysisView";
import {
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_REFERENCE_IMAGE_BYTES,
  validateReferenceImageFile,
} from "@/lib/agents/reference-analysis/image";
import type { ProjectContext } from "@/lib/schemas/project-context";
import {
  ReferenceAnalysisSchema,
  type ReferenceAnalysis,
} from "@/lib/schemas/reference-analysis";

type ReferenceAnalysisPanelProps = {
  projectContext: ProjectContext;
};

function createReferenceId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `ref-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatBytes(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function ReferenceAnalysisPanel({
  projectContext,
}: ReferenceAnalysisPanelProps) {
  const [referenceId, setReferenceId] = useState(createReferenceId);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ReferenceAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const accept = useMemo(() => ALLOWED_IMAGE_MIME_TYPES.join(","), []);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function replacePreview(nextUrl: string | null) {
    setPreviewUrl((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return nextUrl;
    });
  }

  function handleFileChange(nextFile: File | null) {
    setAnalysis(null);
    setRequestError(null);

    if (!nextFile) {
      setFile(null);
      setValidationError(null);
      replacePreview(null);
      return;
    }

    const validated = validateReferenceImageFile(nextFile);
    if (!validated.success) {
      setFile(null);
      setValidationError(validated.error);
      replacePreview(null);
      return;
    }

    setValidationError(null);
    setFile(nextFile);
    setReferenceId(createReferenceId());
    replacePreview(URL.createObjectURL(nextFile));
  }

  async function handleAnalyze() {
    if (!file || isAnalyzing) return;

    const validated = validateReferenceImageFile(file);
    if (!validated.success) {
      setValidationError(validated.error);
      return;
    }

    setIsAnalyzing(true);
    setRequestError(null);
    setAnalysis(null);

    try {
      const formData = new FormData();
      formData.append("projectContext", JSON.stringify(projectContext));
      formData.append("referenceId", referenceId);
      formData.append("image", file);

      const response = await fetch("/api/agents/reference-analysis", {
        method: "POST",
        body: formData,
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
        setRequestError(errorMessage || "Reference analysis request failed.");
        return;
      }

      const analysisPayload =
        payload &&
        typeof payload === "object" &&
        "referenceAnalysis" in payload
          ? (payload as { referenceAnalysis: unknown }).referenceAnalysis
          : null;

      const parsed = ReferenceAnalysisSchema.safeParse(analysisPayload);
      if (!parsed.success) {
        setRequestError("Received an invalid ReferenceAnalysis payload.");
        return;
      }

      setAnalysis(parsed.data);
    } catch {
      setRequestError("Could not reach the reference analysis endpoint.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <section className="mt-10 border-t border-zinc-200 pt-8 dark:border-zinc-800">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        Image reference analysis
      </h2>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Attach a visually compelling reference image. The agent extracts
        transferable principles for this project — it does not copy the
        reference.
      </p>
      <p className="mt-2 text-xs text-zinc-500">
        PNG, JPEG, or WEBP. Max {Math.floor(MAX_REFERENCE_IMAGE_BYTES / (1024 * 1024))}{" "}
        MB. Image is used for this request only and is not stored.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="inline-flex cursor-pointer items-center rounded border border-zinc-300 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900">
          Select image
          <input
            type="file"
            accept={accept}
            className="sr-only"
            disabled={isAnalyzing}
            onChange={(event) => {
              const next = event.target.files?.[0] ?? null;
              handleFileChange(next);
              event.target.value = "";
            }}
          />
        </label>

        <button
          type="button"
          disabled={!file || isAnalyzing}
          onClick={() => {
            void handleAnalyze();
          }}
          className="rounded bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          {isAnalyzing ? "Analyzing…" : "Analyze reference"}
        </button>

        {file ? (
          <button
            type="button"
            disabled={isAnalyzing}
            onClick={() => handleFileChange(null)}
            className="rounded px-3 py-2 text-sm text-zinc-500 underline-offset-2 hover:underline disabled:opacity-60"
          >
            Clear image
          </button>
        ) : null}
      </div>

      {file ? (
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          {file.name} ({formatBytes(file.size)})
        </p>
      ) : null}

      {previewUrl ? (
        // Local object-URL preview; next/image is unnecessary for ephemeral blobs.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previewUrl}
          alt="Selected reference preview"
          className="mt-4 max-h-80 w-auto max-w-full rounded border border-zinc-200 object-contain dark:border-zinc-800"
        />
      ) : null}

      {validationError ? (
        <p
          className="mt-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
          role="alert"
        >
          {validationError}
        </p>
      ) : null}

      {requestError ? (
        <p
          className="mt-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
          role="alert"
        >
          {requestError}
        </p>
      ) : null}

      {analysis ? <ReferenceAnalysisView analysis={analysis} /> : null}
    </section>
  );
}
