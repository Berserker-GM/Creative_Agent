/**
 * Placeholder entry point for project creation.
 * Non-functional in Milestone 01 — wired up in a later milestone.
 */
export function ProjectCreateEntry() {
  return (
    <div className="mt-10 w-full max-w-md">
      <label
        htmlFor="project-name"
        className="block text-sm text-zinc-600 dark:text-zinc-400"
      >
        Project name
      </label>
      <div className="mt-2 flex gap-2">
        <input
          id="project-name"
          type="text"
          name="projectName"
          placeholder="Untitled project"
          disabled
          className="min-w-0 flex-1 rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
        />
        <button
          type="button"
          disabled
          className="rounded border border-zinc-300 bg-zinc-100 px-4 py-2 text-sm text-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
        >
          Create project
        </button>
      </div>
      <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
        Project creation is not available yet.
      </p>
    </div>
  );
}
