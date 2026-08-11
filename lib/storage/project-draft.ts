import { z } from "zod";

const DRAFT_STORAGE_KEY = "cfe:project-intake-draft:v1";

const DraftLocalFileMetaSchema = z.object({
  name: z.string(),
  size: z.number().nonnegative(),
  mimeType: z.string(),
});

const DraftReferenceSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["image", "video", "website"]),
  /** Website URL, or empty while a local file is pending / metadata-only. */
  source: z.string(),
  title: z.string().optional(),
  notes: z.string().optional(),
  /** Serializable file metadata only — never a File object. */
  localFile: DraftLocalFileMetaSchema.optional(),
});

export const ProjectIntakeDraftSchema = z.object({
  name: z.string(),
  product: z.string(),
  problem: z.string(),
  targetUsers: z.string(),
  personality: z.string(),
  visualAvoidances: z.string(),
  goals: z.string(),
  existingProductUrl: z.string(),
  references: z.array(DraftReferenceSchema),
  savedAt: z.string(),
});

export type DraftLocalFileMeta = z.infer<typeof DraftLocalFileMetaSchema>;
export type DraftReference = z.infer<typeof DraftReferenceSchema>;
export type ProjectIntakeDraft = z.infer<typeof ProjectIntakeDraftSchema>;

export function createEmptyDraft(): ProjectIntakeDraft {
  return {
    name: "",
    product: "",
    problem: "",
    targetUsers: "",
    personality: "",
    visualAvoidances: "",
    goals: "",
    existingProductUrl: "",
    references: [],
    savedAt: new Date().toISOString(),
  };
}

function canUseLocalStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function loadProjectDraft(): ProjectIntakeDraft | null {
  if (!canUseLocalStorage()) return null;

  try {
    const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    const result = ProjectIntakeDraftSchema.safeParse(parsed);
    if (!result.success) {
      window.localStorage.removeItem(DRAFT_STORAGE_KEY);
      return null;
    }

    return result.data;
  } catch {
    try {
      window.localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {
      // ignore cleanup failures
    }
    return null;
  }
}

export function saveProjectDraft(draft: ProjectIntakeDraft): void {
  if (!canUseLocalStorage()) return;

  const payload: ProjectIntakeDraft = {
    ...draft,
    savedAt: new Date().toISOString(),
  };

  try {
    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Quota or private mode — fail silently for draft autosave
  }
}

export function clearProjectDraft(): void {
  if (!canUseLocalStorage()) return;

  try {
    window.localStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch {
    // ignore
  }
}
