import type { ReactNode } from "react";
import type { CreativeDirection } from "@/lib/schemas/creative-direction";

type CreativeDirectionsViewProps = {
  directions: CreativeDirection[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p>
      <div className="text-sm text-zinc-700 dark:text-zinc-300">{children}</div>
    </div>
  );
}

function List({ items }: { items: string[] }) {
  if (items.length === 0) {
    return <p className="text-zinc-500">None</p>;
  }

  return (
    <ul className="list-disc space-y-1 pl-5">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export function CreativeDirectionsView({
  directions,
  selectedId,
  onSelect,
}: CreativeDirectionsViewProps) {
  return (
    <div className="mt-6 space-y-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          AI-generated creative directions
        </p>
        <p className="mt-1 text-sm text-zinc-500">
          Four distinct conceptual directions. Select one concept, then build
          its design genome — selection is session-only for now.
        </p>
      </div>

      <ol className="space-y-10">
        {directions.map((direction, index) => {
          const selected = selectedId === direction.id;

          return (
            <li
              key={direction.id}
              className={`border-t pt-6 dark:border-zinc-800 ${
                selected
                  ? "border-zinc-900 dark:border-zinc-100"
                  : "border-zinc-200"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-zinc-500">
                    Direction {index + 1}
                  </p>
                  <h3 className="mt-1 text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                    {direction.name}
                  </h3>
                  <p className="mt-2 text-base text-zinc-600 dark:text-zinc-300">
                    {direction.tagline}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onSelect(direction.id)}
                  aria-pressed={selected}
                  className={`rounded px-4 py-2 text-sm ${
                    selected
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                      : "border border-zinc-300 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
                  }`}
                >
                  {selected ? "Selected" : "Select this direction"}
                </button>
              </div>

              <div className="mt-6 space-y-4">
                <Field label="Core concept">
                  <p>{direction.coreConcept}</p>
                </Field>
                <Field label="Why it fits">
                  <p>{direction.productFit}</p>
                </Field>
                <Field label="Experience">
                  <p>{direction.experience}</p>
                </Field>
                <Field label="Visual language">
                  <List items={direction.visualLanguage} />
                </Field>
                <Field label="Composition">
                  <p>{direction.compositionApproach}</p>
                </Field>
                <Field label="Imagery">
                  <p>{direction.imageryApproach}</p>
                </Field>
                <Field label="Motion">
                  <p>{direction.motionApproach}</p>
                </Field>
                <Field label="Interaction">
                  <p>{direction.interactionCharacter}</p>
                </Field>
                <Field label="Reference influences">
                  <List items={direction.referenceInfluences} />
                </Field>
                <Field label="Distinctive quality">
                  <p>{direction.distinctiveQuality}</p>
                </Field>
                <Field label="Risks">
                  <List items={direction.risks} />
                </Field>
                <Field label="Anti-patterns">
                  <List items={direction.antiPatterns} />
                </Field>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
