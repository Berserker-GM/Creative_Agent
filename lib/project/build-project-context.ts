import {
  ProjectContextSchema,
  type ProjectContext,
  type Reference,
} from "@/lib/schemas/project-context";
import type { DraftReference, ProjectIntakeDraft } from "@/lib/storage/project-draft";

function createId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `project-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function splitLines(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function toReference(draftRef: DraftReference): Reference | null {
  if (draftRef.type === "website") {
    const source = draftRef.source.trim();
    if (!source) return null;

    return {
      id: draftRef.id,
      type: "website",
      source,
      ...(draftRef.title?.trim() ? { title: draftRef.title.trim() } : {}),
      ...(draftRef.notes?.trim() ? { notes: draftRef.notes.trim() } : {}),
    };
  }

  const fileName = draftRef.localFile?.name?.trim() || draftRef.title?.trim();
  if (!fileName) return null;

  return {
    id: draftRef.id,
    type: draftRef.type,
    source: `local:${fileName}`,
    title: draftRef.title?.trim() || fileName,
    ...(draftRef.notes?.trim() ? { notes: draftRef.notes.trim() } : {}),
  };
}

export type BuildProjectContextResult =
  | { success: true; data: ProjectContext }
  | {
      success: false;
      error: {
        formErrors: string[];
        fieldErrors: Partial<Record<keyof ProjectContext | "existingProductUrl", string[]>>;
      };
    };

/**
 * Builds and validates a ProjectContext from intake draft form state.
 */
export function buildProjectContextFromDraft(
  draft: ProjectIntakeDraft,
  options?: { id?: string; createdAt?: string },
): BuildProjectContextResult {
  const now = new Date().toISOString();
  const existingUrl = draft.existingProductUrl.trim();

  const references = draft.references
    .map(toReference)
    .filter((ref): ref is Reference => ref !== null);

  const candidate = {
    id: options?.id ?? createId(),
    name: draft.name.trim(),
    product: draft.product.trim(),
    problem: draft.problem.trim() || undefined,
    solution: undefined,
    targetUsers: draft.targetUsers.trim() || undefined,
    goals: splitLines(draft.goals),
    personality: draft.personality.trim() || undefined,
    emotions: [],
    features: [],
    visualPreferences: undefined,
    visualAvoidances: draft.visualAvoidances.trim() || undefined,
    references,
    constraints: {
      mustKeep: [],
      mustAvoid: [],
      performance: [],
    },
    existingProduct: existingUrl
      ? {
          type: "url" as const,
          source: existingUrl,
        }
      : null,
    createdAt: options?.createdAt ?? now,
    updatedAt: now,
  };

  const parsed = ProjectContextSchema.safeParse(candidate);

  if (!parsed.success) {
    const fieldErrors: Partial<
      Record<keyof ProjectContext | "existingProductUrl", string[]>
    > = {};
    const formErrors: string[] = [];

    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string") {
        const bucket = fieldErrors[key as keyof typeof fieldErrors] ?? [];
        bucket.push(issue.message);
        fieldErrors[key as keyof typeof fieldErrors] = bucket;
      } else {
        formErrors.push(issue.message);
      }
    }

    return {
      success: false,
      error: { formErrors, fieldErrors },
    };
  }

  return { success: true, data: parsed.data };
}

export { createId };
