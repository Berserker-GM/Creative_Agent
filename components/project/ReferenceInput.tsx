"use client";

import type { DraftLocalFileMeta, DraftReference } from "@/lib/storage/project-draft";

type ReferenceInputProps = {
  references: DraftReference[];
  /** Reference IDs that currently have an in-memory File (not persisted). */
  attachedFileIds: ReadonlySet<string>;
  onChange: (references: DraftReference[]) => void;
  onPendingFile: (id: string, file: File | null) => void;
  disabled?: boolean;
};

function createReferenceId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `ref-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function fileMeta(file: File): DraftLocalFileMeta {
  return {
    name: file.name,
    size: file.size,
    mimeType: file.type || "application/octet-stream",
  };
}

function formatBytes(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function ReferenceInput({
  references,
  attachedFileIds,
  onChange,
  onPendingFile,
  disabled = false,
}: ReferenceInputProps) {
  function updateReference(id: string, patch: Partial<DraftReference>) {
    onChange(
      references.map((ref) => (ref.id === id ? { ...ref, ...patch } : ref)),
    );
  }

  function removeReference(id: string) {
    onPendingFile(id, null);
    onChange(references.filter((ref) => ref.id !== id));
  }

  function addWebsite() {
    onChange([
      ...references,
      {
        id: createReferenceId(),
        type: "website",
        source: "",
        title: "",
        notes: "",
      },
    ]);
  }

  function addFileReference(type: "image" | "video", file: File) {
    const id = createReferenceId();
    onPendingFile(id, file);
    onChange([
      ...references,
      {
        id,
        type,
        source: "",
        title: file.name,
        notes: "",
        localFile: fileMeta(file),
      },
    ]);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={addWebsite}
          className="rounded border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          Add website
        </button>

        <label className="inline-flex cursor-pointer items-center rounded border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900">
          Add image
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={disabled}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) addFileReference("image", file);
              event.target.value = "";
            }}
          />
        </label>

        <label className="inline-flex cursor-pointer items-center rounded border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900">
          Add video
          <input
            type="file"
            accept="video/*"
            className="sr-only"
            disabled={disabled}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) addFileReference("video", file);
              event.target.value = "";
            }}
          />
        </label>
      </div>

      {references.length === 0 ? (
        <p className="text-sm text-zinc-500">No references yet. Optional.</p>
      ) : (
        <ul className="space-y-3">
          {references.map((ref) => (
            <li
              key={ref.id}
              className="rounded border border-zinc-200 p-3 dark:border-zinc-800"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  {ref.type}
                </p>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => removeReference(ref.id)}
                  className="text-sm text-zinc-500 underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Remove
                </button>
              </div>

              {ref.type === "website" ? (
                <div className="mt-3 space-y-2">
                  <label
                    htmlFor={`ref-url-${ref.id}`}
                    className="block text-sm text-zinc-600 dark:text-zinc-400"
                  >
                    URL
                  </label>
                  <input
                    id={`ref-url-${ref.id}`}
                    type="url"
                    inputMode="url"
                    placeholder="https://"
                    value={ref.source}
                    disabled={disabled}
                    onChange={(event) =>
                      updateReference(ref.id, { source: event.target.value })
                    }
                    className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                  />
                </div>
              ) : (
                <div className="mt-3 space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                  {ref.localFile ? (
                    <>
                      <p>
                        {ref.localFile.name}{" "}
                        <span className="text-zinc-400">
                          ({formatBytes(ref.localFile.size)})
                        </span>
                      </p>
                      {attachedFileIds.has(ref.id) ? (
                        <p className="text-xs text-zinc-500">
                          File attached in this browser session (not uploaded to
                          the cloud).
                        </p>
                      ) : (
                        <p className="text-xs text-amber-700 dark:text-amber-400">
                          File binary is not available after refresh. Metadata
                          was restored — re-attach if you still need the file.
                        </p>
                      )}
                      <label className="inline-flex cursor-pointer text-sm text-zinc-700 underline-offset-2 hover:underline dark:text-zinc-300">
                        Re-attach file
                        <input
                          type="file"
                          accept={ref.type === "image" ? "image/*" : "video/*"}
                          className="sr-only"
                          disabled={disabled}
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (!file) return;
                            onPendingFile(ref.id, file);
                            updateReference(ref.id, {
                              localFile: fileMeta(file),
                              title: file.name,
                            });
                            event.target.value = "";
                          }}
                        />
                      </label>
                    </>
                  ) : (
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      Local file metadata missing. Re-attach a file.
                    </p>
                  )}
                </div>
              )}

              <div className="mt-3 space-y-2">
                <label
                  htmlFor={`ref-notes-${ref.id}`}
                  className="block text-sm text-zinc-600 dark:text-zinc-400"
                >
                  Notes (optional)
                </label>
                <input
                  id={`ref-notes-${ref.id}`}
                  type="text"
                  value={ref.notes ?? ""}
                  disabled={disabled}
                  onChange={(event) =>
                    updateReference(ref.id, { notes: event.target.value })
                  }
                  className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
