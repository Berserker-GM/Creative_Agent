"use client";

import {
  useMemo,
  useState,
  useSyncExternalStore,
  useTransition,
  type FormEvent,
} from "react";
import { CreativeDirectionsView } from "@/components/project/CreativeDirectionsView";
import { ProductUnderstandingView } from "@/components/project/ProductUnderstandingView";
import { ReferenceAnalysisPanel } from "@/components/project/ReferenceAnalysisPanel";
import { ReferenceInput } from "@/components/project/ReferenceInput";
import { buildProjectContextFromDraft } from "@/lib/project/build-project-context";
import {
  CreativeDirectionSchema,
  type CreativeDirection,
} from "@/lib/schemas/creative-direction";
import type { ProjectContext } from "@/lib/schemas/project-context";
import {
  ProductUnderstandingSchema,
  type ProductUnderstanding,
} from "@/lib/schemas/product-understanding";
import type { ReferenceAnalysis } from "@/lib/schemas/reference-analysis";
import type { ProjectIntakeDraft } from "@/lib/storage/project-draft";
import { z } from "zod";
import {
  getProjectDraftServerSnapshot,
  getProjectDraftSnapshot,
  resetProjectDraft,
  subscribeProjectDraft,
  writeProjectDraft,
} from "@/lib/storage/project-draft-store";
import { saveProject } from "@/lib/storage/projects";

type FieldKey =
  | "name"
  | "product"
  | "problem"
  | "targetUsers"
  | "personality"
  | "visualAvoidances"
  | "goals"
  | "existingProductUrl";

const fieldClassName =
  "mt-2 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100";

const labelClassName = "block text-sm text-zinc-600 dark:text-zinc-400";

function draftHasSecondaryDetails(draft: ProjectIntakeDraft): boolean {
  return (
    Boolean(draft.problem.trim()) ||
    Boolean(draft.targetUsers.trim()) ||
    Boolean(draft.personality.trim()) ||
    Boolean(draft.visualAvoidances.trim()) ||
    Boolean(draft.goals.trim()) ||
    Boolean(draft.existingProductUrl.trim()) ||
    draft.references.length > 0
  );
}

export function ProjectIntake() {
  const draft = useSyncExternalStore(
    subscribeProjectDraft,
    getProjectDraftSnapshot,
    getProjectDraftServerSnapshot,
  );
  /** null = follow draft contents; boolean = explicit user toggle */
  const [detailsOpen, setDetailsOpen] = useState<boolean | null>(null);
  const [pendingFiles, setPendingFiles] = useState<Record<string, File>>({});
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<string, string[]>>
  >({});
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [savedProject, setSavedProject] = useState<ProjectContext | null>(null);
  const [understanding, setUnderstanding] =
    useState<ProductUnderstanding | null>(null);
  const [understandingError, setUnderstandingError] = useState<string | null>(
    null,
  );
  const [isUnderstanding, setIsUnderstanding] = useState(false);
  const [referenceAnalyses, setReferenceAnalyses] = useState<
    ReferenceAnalysis[]
  >([]);
  const [directions, setDirections] = useState<CreativeDirection[]>([]);
  const [selectedDirectionId, setSelectedDirectionId] = useState<string | null>(
    null,
  );
  const [directionsError, setDirectionsError] = useState<string | null>(null);
  const [isGeneratingDirections, setIsGeneratingDirections] = useState(false);
  const [isPending, startTransition] = useTransition();

  const showDetails = detailsOpen ?? draftHasSecondaryDetails(draft);

  const draftHint = useMemo(() => {
    if (savedProject) return null;
    return "Draft saved in this browser.";
  }, [savedProject]);

  function updateDraft(next: ProjectIntakeDraft) {
    setSavedProject(null);
    setSubmitError(null);
    writeProjectDraft(next);
  }

  function updateField<K extends FieldKey>(key: K, value: ProjectIntakeDraft[K]) {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
    updateDraft({ ...draft, [key]: value });
  }

  function handlePendingFile(id: string, file: File | null) {
    setPendingFiles((prev) => {
      const next = { ...prev };
      if (file) next[id] = file;
      else delete next[id];
      return next;
    });
  }

  function handleClearDraft() {
    resetProjectDraft();
    setPendingFiles({});
    setFieldErrors({});
    setFormErrors([]);
    setSubmitError(null);
    setSavedProject(null);
    setDetailsOpen(false);
  }

  function handleCancel() {
    handleClearDraft();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);
    setFormErrors([]);
    setFieldErrors({});

    startTransition(() => {
      const result = buildProjectContextFromDraft(draft);

      if (!result.success) {
        setFormErrors(result.error.formErrors);
        setFieldErrors(result.error.fieldErrors);
        return;
      }

      try {
        saveProject(result.data);
        resetProjectDraft();
        setPendingFiles({});
        setSavedProject(result.data);
        setUnderstanding(null);
        setUnderstandingError(null);
        setReferenceAnalyses([]);
        setDirections([]);
        setSelectedDirectionId(null);
        setDirectionsError(null);
        setDetailsOpen(false);
      } catch {
        setSubmitError("Could not save the project in this browser.");
      }
    });
  }

  async function handleUnderstandProject() {
    if (!savedProject || isUnderstanding) return;

    setIsUnderstanding(true);
    setUnderstandingError(null);

    try {
      const response = await fetch("/api/agents/product-understanding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(savedProject),
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
        setUnderstanding(null);
        setUnderstandingError(
          errorMessage || "Product understanding request failed.",
        );
        return;
      }

      const understandingPayload =
        payload &&
        typeof payload === "object" &&
        "productUnderstanding" in payload
          ? (payload as { productUnderstanding: unknown }).productUnderstanding
          : null;

      if (!understandingPayload) {
        setUnderstanding(null);
        setUnderstandingError("Unexpected response from the server.");
        return;
      }

      const parsed = ProductUnderstandingSchema.safeParse(understandingPayload);
      if (!parsed.success) {
        setUnderstanding(null);
        setUnderstandingError(
          "Received an invalid ProductUnderstanding payload.",
        );
        return;
      }

      setUnderstanding(parsed.data);
    } catch {
      setUnderstanding(null);
      setUnderstandingError(
        "Could not reach the product understanding endpoint.",
      );
    } finally {
      setIsUnderstanding(false);
    }
  }

  function handleReferenceAnalysisChange(analysis: ReferenceAnalysis | null) {
    if (!analysis) return;
    setReferenceAnalyses((previous) => {
      const without = previous.filter(
        (item) => item.referenceId !== analysis.referenceId,
      );
      return [...without, analysis];
    });
  }

  async function handleGenerateDirections() {
    if (!savedProject || !understanding || isGeneratingDirections) return;

    setIsGeneratingDirections(true);
    setDirectionsError(null);

    try {
      const response = await fetch("/api/agents/creative-directions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectContext: savedProject,
          productUnderstanding: understanding,
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
        setDirections([]);
        setSelectedDirectionId(null);
        setDirectionsError(
          errorMessage || "Creative directions request failed.",
        );
        return;
      }

      const directionsPayload =
        payload &&
        typeof payload === "object" &&
        "creativeDirections" in payload
          ? (payload as { creativeDirections: unknown }).creativeDirections
          : null;

      const parsed = z
        .array(CreativeDirectionSchema)
        .length(4)
        .safeParse(directionsPayload);

      if (!parsed.success) {
        setDirections([]);
        setSelectedDirectionId(null);
        setDirectionsError("Received an invalid creative directions payload.");
        return;
      }

      setDirections(parsed.data);
      setSelectedDirectionId(null);
    } catch {
      setDirections([]);
      setSelectedDirectionId(null);
      setDirectionsError("Could not reach the creative directions endpoint.");
    } finally {
      setIsGeneratingDirections(false);
    }
  }

  if (savedProject) {
    return (
      <section className="mt-10 w-full max-w-2xl" aria-live="polite">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Project saved
        </h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Stored locally in this browser as{" "}
          <span className="font-medium text-zinc-800 dark:text-zinc-200">
            {savedProject.name}
          </span>
          .
        </p>
        <dl className="mt-6 space-y-3 text-sm">
          <div>
            <dt className="text-zinc-500">ID</dt>
            <dd className="mt-1 font-mono text-xs text-zinc-700 dark:text-zinc-300">
              {savedProject.id}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500">What you&apos;re building</dt>
            <dd className="mt-1 whitespace-pre-wrap text-zinc-800 dark:text-zinc-200">
              {savedProject.product}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500">References</dt>
            <dd className="mt-1 text-zinc-800 dark:text-zinc-200">
              {savedProject.references.length}
            </dd>
          </div>
        </dl>
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={isUnderstanding}
            onClick={() => {
              void handleUnderstandProject();
            }}
            className="rounded bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
          >
            {isUnderstanding ? "Understanding…" : "Understand my project"}
          </button>
          <button
            type="button"
            disabled={isUnderstanding}
            onClick={() => {
              setSavedProject(null);
              setUnderstanding(null);
              setUnderstandingError(null);
              setReferenceAnalyses([]);
              setDirections([]);
              setSelectedDirectionId(null);
              setDirectionsError(null);
              setDetailsOpen(null);
            }}
            className="rounded border border-zinc-300 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            Start another project
          </button>
        </div>

        {understandingError ? (
          <p
            className="mt-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
            role="alert"
          >
            {understandingError}
          </p>
        ) : null}

        {understanding ? (
          <ProductUnderstandingView understanding={understanding} />
        ) : null}

        <ReferenceAnalysisPanel
          projectContext={savedProject}
          onAnalysisChange={handleReferenceAnalysisChange}
        />

        {understanding ? (
          <section className="mt-10 border-t border-zinc-200 pt-8 dark:border-zinc-800">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Creative directions
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Generate four distinct conceptual directions from product
              understanding
              {referenceAnalyses.length > 0
                ? ` and ${referenceAnalyses.length} reference analysis${referenceAnalyses.length === 1 ? "" : "es"}`
                : ""}
              .
            </p>
            <div className="mt-4">
              <button
                type="button"
                disabled={isGeneratingDirections || isUnderstanding}
                onClick={() => {
                  void handleGenerateDirections();
                }}
                className="rounded bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
              >
                {isGeneratingDirections
                  ? "Generating…"
                  : "Generate creative directions"}
              </button>
            </div>

            {directionsError ? (
              <p
                className="mt-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
                role="alert"
              >
                {directionsError}
              </p>
            ) : null}

            {directions.length === 4 ? (
              <CreativeDirectionsView
                directions={directions}
                selectedId={selectedDirectionId}
                onSelect={setSelectedDirectionId}
              />
            ) : null}
          </section>
        ) : null}
      </section>
    );
  }

  return (
    <section className="mt-10 w-full max-w-2xl">
      <form onSubmit={handleSubmit} noValidate className="space-y-8">
        <div>
          <label
            htmlFor="product"
            className="block text-base font-medium text-zinc-900 dark:text-zinc-50"
          >
            What are you building?
          </label>
          <p className="mt-1 text-sm text-zinc-500">
            Describe the product in your own words. This is the most important
            input.
          </p>
          <textarea
            id="product"
            name="product"
            required
            rows={5}
            value={draft.product}
            disabled={isPending}
            onChange={(event) => updateField("product", event.target.value)}
            placeholder="A calm workspace for freelance designers to pitch, invoice, and keep client feedback in one place…"
            aria-invalid={Boolean(fieldErrors.product?.length)}
            aria-describedby={
              fieldErrors.product?.length ? "product-error" : undefined
            }
            className={`${fieldClassName} min-h-32 text-base leading-relaxed`}
          />
          {fieldErrors.product?.length ? (
            <p
              id="product-error"
              className="mt-2 text-sm text-red-600 dark:text-red-400"
              role="alert"
            >
              {fieldErrors.product[0]}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="name" className={labelClassName}>
            Project name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            value={draft.name}
            disabled={isPending}
            onChange={(event) => updateField("name", event.target.value)}
            placeholder="Pitchroom"
            aria-invalid={Boolean(fieldErrors.name?.length)}
            aria-describedby={
              fieldErrors.name?.length ? "name-error" : undefined
            }
            className={fieldClassName}
          />
          {fieldErrors.name?.length ? (
            <p
              id="name-error"
              className="mt-2 text-sm text-red-600 dark:text-red-400"
              role="alert"
            >
              {fieldErrors.name[0]}
            </p>
          ) : null}
        </div>

        <div>
          <button
            type="button"
            onClick={() => {
              setDetailsOpen(!showDetails);
            }}
            className="text-sm text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400"
            aria-expanded={showDetails}
          >
            {showDetails ? "Hide optional details" : "Add optional details"}
          </button>
        </div>

        {showDetails ? (
          <div className="space-y-6 border-t border-zinc-200 pt-6 dark:border-zinc-800">
            <div>
              <label htmlFor="problem" className={labelClassName}>
                What problem does it solve?
              </label>
              <textarea
                id="problem"
                name="problem"
                rows={3}
                value={draft.problem}
                disabled={isPending}
                onChange={(event) => updateField("problem", event.target.value)}
                className={fieldClassName}
              />
            </div>

            <div>
              <label htmlFor="targetUsers" className={labelClassName}>
                Who is it for?
              </label>
              <input
                id="targetUsers"
                name="targetUsers"
                type="text"
                value={draft.targetUsers}
                disabled={isPending}
                onChange={(event) =>
                  updateField("targetUsers", event.target.value)
                }
                placeholder="Freelance designers, small studios…"
                className={fieldClassName}
              />
            </div>

            <div>
              <label htmlFor="personality" className={labelClassName}>
                What should it feel like?
              </label>
              <textarea
                id="personality"
                name="personality"
                rows={2}
                value={draft.personality}
                disabled={isPending}
                onChange={(event) =>
                  updateField("personality", event.target.value)
                }
                placeholder="Quiet confidence, editorial, unhurried…"
                className={fieldClassName}
              />
            </div>

            <div>
              <label htmlFor="visualAvoidances" className={labelClassName}>
                What should it NOT feel like?
              </label>
              <textarea
                id="visualAvoidances"
                name="visualAvoidances"
                rows={2}
                value={draft.visualAvoidances}
                disabled={isPending}
                onChange={(event) =>
                  updateField("visualAvoidances", event.target.value)
                }
                placeholder="Generic SaaS, neon startup energy, cluttered dashboards…"
                className={fieldClassName}
              />
            </div>

            <div>
              <label htmlFor="goals" className={labelClassName}>
                Goals
              </label>
              <p className="mt-1 text-xs text-zinc-500">One goal per line.</p>
              <textarea
                id="goals"
                name="goals"
                rows={3}
                value={draft.goals}
                disabled={isPending}
                onChange={(event) => updateField("goals", event.target.value)}
                placeholder={
                  "Win trust in the first scroll\nMake pitching feel calm"
                }
                className={fieldClassName}
              />
            </div>

            <div>
              <label htmlFor="existingProductUrl" className={labelClassName}>
                Existing product URL (optional)
              </label>
              <input
                id="existingProductUrl"
                name="existingProductUrl"
                type="url"
                inputMode="url"
                value={draft.existingProductUrl}
                disabled={isPending}
                onChange={(event) =>
                  updateField("existingProductUrl", event.target.value)
                }
                placeholder="https://"
                aria-invalid={Boolean(fieldErrors.existingProduct?.length)}
                className={fieldClassName}
              />
              {fieldErrors.existingProduct?.length ? (
                <p
                  className="mt-2 text-sm text-red-600 dark:text-red-400"
                  role="alert"
                >
                  {fieldErrors.existingProduct[0]}
                </p>
              ) : null}
            </div>

            <div>
              <h3 className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                References (optional)
              </h3>
              <p className="mt-1 text-xs text-zinc-500">
                Websites use a URL. Images and videos stay on this device for
                now.
              </p>
              <div className="mt-3">
                <ReferenceInput
                  references={draft.references}
                  attachedFileIds={new Set(Object.keys(pendingFiles))}
                  disabled={isPending}
                  onPendingFile={handlePendingFile}
                  onChange={(references) => {
                    updateDraft({ ...draft, references });
                  }}
                />
              </div>
            </div>
          </div>
        ) : null}

        {(formErrors.length > 0 || submitError) && (
          <div
            className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
            role="alert"
          >
            {submitError ? <p>{submitError}</p> : null}
            {formErrors.map((error) => (
              <p key={error}>{error}</p>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-zinc-200 pt-6 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800">
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="rounded bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            >
              {isPending ? "Saving…" : "Save project"}
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={handleCancel}
              className="rounded border border-zinc-300 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={handleClearDraft}
              className="rounded px-4 py-2 text-sm text-zinc-500 underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
            >
              Clear draft
            </button>
          </div>
          {draftHint ? (
            <p className="text-xs text-zinc-500">{draftHint}</p>
          ) : null}
        </div>
      </form>
    </section>
  );
}
