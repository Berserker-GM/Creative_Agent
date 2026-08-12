import type { ReactNode } from "react";
import type { DesignGenome } from "@/lib/schemas/design-genome";

type DesignGenomeViewProps = {
  genome: DesignGenome;
  creativeDirectionName?: string;
};

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3 border-t border-zinc-200 pt-6 dark:border-zinc-800">
      <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

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

export function DesignGenomeView({
  genome,
  creativeDirectionName,
}: DesignGenomeViewProps) {
  return (
    <div className="mt-6 space-y-2">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Design genome
        </p>
        <p className="mt-1 text-sm text-zinc-500">
          Visual and interactive rules derived from
          {creativeDirectionName
            ? ` “${creativeDirectionName}”`
            : " the selected creative direction"}
          . Session-only for now — not the final product UI.
        </p>
        <p className="mt-2 font-mono text-xs text-zinc-500">
          genome: {genome.id} · direction: {genome.creativeDirectionId}
        </p>
      </div>

      <Section title="Visual DNA">
        <Field label="Character">
          <p>{genome.visualDNA.character}</p>
        </Field>
        <Field label="Principles">
          <List items={genome.visualDNA.principles} />
        </Field>
      </Section>

      <Section title="Typography">
        <Field label="Character">
          <p>{genome.typography.character}</p>
        </Field>
        <Field label="Hierarchy">
          <p>{genome.typography.hierarchy}</p>
        </Field>
        <Field label="Role">
          <p>{genome.typography.role}</p>
        </Field>
        <Field label="Principles">
          <List items={genome.typography.principles} />
        </Field>
      </Section>

      <Section title="Color">
        <Field label="Philosophy">
          <p>{genome.color.philosophy}</p>
        </Field>
        <Field label="Hierarchy">
          <p>{genome.color.hierarchy}</p>
        </Field>
        <Field label="Emphasis">
          <p>{genome.color.emphasis}</p>
        </Field>
        <Field label="Principles">
          <List items={genome.color.principles} />
        </Field>
      </Section>

      <Section title="Composition">
        <Field label="Philosophy">
          <p>{genome.composition.philosophy}</p>
        </Field>
        <Field label="Hierarchy">
          <p>{genome.composition.hierarchy}</p>
        </Field>
        <Field label="Principles">
          <List items={genome.composition.principles} />
        </Field>
      </Section>

      <Section title="Spatial behavior">
        <Field label="Philosophy">
          <p>{genome.spatialBehavior.philosophy}</p>
        </Field>
        <Field label="Relationships">
          <List items={genome.spatialBehavior.relationships} />
        </Field>
        <Field label="Principles">
          <List items={genome.spatialBehavior.principles} />
        </Field>
      </Section>

      <Section title="Imagery">
        <Field label="Role">
          <p>{genome.imagery.role}</p>
        </Field>
        <Field label="Subject strategy">
          <p>{genome.imagery.subjectStrategy}</p>
        </Field>
        <Field label="Treatment">
          <p>{genome.imagery.treatment}</p>
        </Field>
        <Field label="Principles">
          <List items={genome.imagery.principles} />
        </Field>
      </Section>

      <Section title="Depth & material">
        <Field label="Character">
          <p>{genome.depthAndMaterial.character}</p>
        </Field>
        <Field label="Layering">
          <p>{genome.depthAndMaterial.layering}</p>
        </Field>
        <Field label="Surface behavior">
          <p>{genome.depthAndMaterial.surfaceBehavior}</p>
        </Field>
        <Field label="Principles">
          <List items={genome.depthAndMaterial.principles} />
        </Field>
      </Section>

      <Section title="Motion">
        <Field label="Character">
          <p>{genome.motion.character}</p>
        </Field>
        <Field label="Purpose">
          <p>{genome.motion.purpose}</p>
        </Field>
        <Field label="Transitions">
          <p>{genome.motion.transitions}</p>
        </Field>
        <Field label="Feedback">
          <p>{genome.motion.feedback}</p>
        </Field>
        <Field label="Principles">
          <List items={genome.motion.principles} />
        </Field>
      </Section>

      <Section title="Interaction">
        <Field label="Character">
          <p>{genome.interaction.character}</p>
        </Field>
        <Field label="Navigation">
          <p>{genome.interaction.navigation}</p>
        </Field>
        <Field label="Feedback">
          <p>{genome.interaction.feedback}</p>
        </Field>
        <Field label="Principles">
          <List items={genome.interaction.principles} />
        </Field>
      </Section>

      <Section title="Density & rhythm">
        <Field label="Information density">
          <p>{genome.densityAndRhythm.informationDensity}</p>
        </Field>
        <Field label="Pacing">
          <p>{genome.densityAndRhythm.pacing}</p>
        </Field>
        <Field label="Whitespace">
          <p>{genome.densityAndRhythm.whitespace}</p>
        </Field>
        <Field label="Principles">
          <List items={genome.densityAndRhythm.principles} />
        </Field>
      </Section>

      <Section title="Responsive behavior">
        <Field label="Philosophy">
          <p>{genome.responsiveBehavior.philosophy}</p>
        </Field>
        <Field label="Priorities">
          <List items={genome.responsiveBehavior.priorities} />
        </Field>
        <Field label="Transformations">
          <List items={genome.responsiveBehavior.transformations} />
        </Field>
      </Section>

      <Section title="Accessibility">
        <Field label="Readability">
          <List items={genome.accessibilityPrinciples.readability} />
        </Field>
        <Field label="Interaction">
          <List items={genome.accessibilityPrinciples.interaction} />
        </Field>
        <Field label="Motion">
          <List items={genome.accessibilityPrinciples.motion} />
        </Field>
      </Section>

      <Section title="Guardrails">
        <Field label="Must preserve">
          <List items={genome.implementationGuardrails.mustPreserve} />
        </Field>
        <Field label="Must avoid">
          <List items={genome.implementationGuardrails.mustAvoid} />
        </Field>
      </Section>

      <Section title="Distinctive signature">
        <Field label="Statement">
          <p>{genome.distinctiveSignature.statement}</p>
        </Field>
        <Field label="Recognizable traits">
          <List items={genome.distinctiveSignature.recognizableTraits} />
        </Field>
      </Section>

      <Section title="Failure modes">
        <Field label="Visual">
          <List items={genome.failureModes.visual} />
        </Field>
        <Field label="Product">
          <List items={genome.failureModes.product} />
        </Field>
        <Field label="Implementation">
          <List items={genome.failureModes.implementation} />
        </Field>
      </Section>
    </div>
  );
}
