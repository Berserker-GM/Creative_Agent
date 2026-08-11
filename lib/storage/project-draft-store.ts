import {
  clearProjectDraft,
  createEmptyDraft,
  loadProjectDraft,
  saveProjectDraft,
  type ProjectIntakeDraft,
} from "@/lib/storage/project-draft";

/** Stable empty snapshot shared by server + initial client hydration. */
const EMPTY_DRAFT: ProjectIntakeDraft = createEmptyDraft();

let memoryDraft: ProjectIntakeDraft = EMPTY_DRAFT;
let didScheduleHydrate = false;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

function hydrateFromStorage(): void {
  const stored = loadProjectDraft();
  memoryDraft = stored ?? createEmptyDraft();
  emit();
}

export function subscribeProjectDraft(listener: () => void): () => void {
  listeners.add(listener);

  // Defer localStorage read until after hydration subscription.
  // Keeps the first client snapshot equal to the server snapshot.
  if (!didScheduleHydrate && typeof window !== "undefined") {
    didScheduleHydrate = true;
    queueMicrotask(() => {
      hydrateFromStorage();
    });
  }

  return () => {
    listeners.delete(listener);
  };
}

export function getProjectDraftSnapshot(): ProjectIntakeDraft {
  return memoryDraft;
}

export function getProjectDraftServerSnapshot(): ProjectIntakeDraft {
  return EMPTY_DRAFT;
}

export function writeProjectDraft(draft: ProjectIntakeDraft): void {
  memoryDraft = draft;
  saveProjectDraft(draft);
  emit();
}

export function resetProjectDraft(): void {
  memoryDraft = createEmptyDraft();
  clearProjectDraft();
  didScheduleHydrate = true;
  emit();
}
