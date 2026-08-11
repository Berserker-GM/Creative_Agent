import {
  ProjectContextSchema,
  type ProjectContext,
} from "@/lib/schemas/project-context";

const PROJECTS_STORAGE_KEY = "cfe:projects:v1";

function canUseLocalStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function listProjects(): ProjectContext[] {
  if (!canUseLocalStorage()) return [];

  try {
    const raw = window.localStorage.getItem(PROJECTS_STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      window.localStorage.removeItem(PROJECTS_STORAGE_KEY);
      return [];
    }

    return parsed.flatMap((item) => {
      const result = ProjectContextSchema.safeParse(item);
      return result.success ? [result.data] : [];
    });
  } catch {
    return [];
  }
}

export function saveProject(project: ProjectContext): void {
  if (!canUseLocalStorage()) {
    throw new Error("localStorage is not available");
  }

  const validated = ProjectContextSchema.parse(project);
  const existing = listProjects().filter((item) => item.id !== validated.id);
  const next = [validated, ...existing];

  window.localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(next));
}

export function getProject(id: string): ProjectContext | null {
  return listProjects().find((project) => project.id === id) ?? null;
}
