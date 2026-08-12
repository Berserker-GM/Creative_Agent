import type { ReactNode } from "react";
import type { ProductUnderstanding } from "@/lib/schemas/product-understanding";

type ProductUnderstandingViewProps = {
  understanding: ProductUnderstanding;
};

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
        {title}
      </h3>
      <div className="text-sm text-zinc-700 dark:text-zinc-300">{children}</div>
    </section>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-1 pl-5">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function Group({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-4">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {title}
      </p>
      {children}
    </div>
  );
}

export function ProductUnderstandingView({
  understanding,
}: ProductUnderstandingViewProps) {
  return (
    <div className="mt-8 space-y-8 border-t border-zinc-200 pt-6 dark:border-zinc-800">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          AI-generated product understanding
        </p>
        <p className="mt-1 text-sm text-zinc-500">
          Derived from ProjectContext. This is understanding, not design.
        </p>
      </div>

      <Group title="Product meaning">
        <Section title="Core problem">
          <p>{understanding.coreProblem}</p>
        </Section>
        <Section title="Core tension">
          <p>{understanding.coreTension}</p>
        </Section>
        <Section title="Product purpose">
          <p>{understanding.productPurpose}</p>
        </Section>
        <Section title="Target audience">
          <p>{understanding.targetAudience}</p>
        </Section>
        <Section title="User needs">
          <List items={understanding.userNeeds} />
        </Section>
        <Section title="Differentiators">
          <List items={understanding.differentiators} />
        </Section>
      </Group>

      <Group title="Journey & experience">
        <Section title="User journey">
          <dl className="space-y-3">
            <div>
              <dt className="text-xs uppercase tracking-wide text-zinc-500">
                Before
              </dt>
              <dd className="mt-1">{understanding.userJourney.before}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-zinc-500">
                During
              </dt>
              <dd className="mt-1">{understanding.userJourney.during}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-zinc-500">
                After
              </dt>
              <dd className="mt-1">{understanding.userJourney.after}</dd>
            </div>
          </dl>
        </Section>
        <Section title="Emotional goals">
          <List items={understanding.emotionalGoals} />
        </Section>
        <Section title="Brand personality">
          <List items={understanding.brandPersonality} />
        </Section>
        <Section title="Experience principles">
          <List items={understanding.experiencePrinciples} />
        </Section>
        <Section title="Anti-patterns">
          <List items={understanding.antiPatterns} />
        </Section>
      </Group>

      <Group title="Implications for later creative work">
        <Section title="Visual opportunities">
          <List items={understanding.visualOpportunities} />
        </Section>
        <Section title="Visual risks">
          <List items={understanding.visualRisks} />
        </Section>
        <Section title="Design implications">
          <List items={understanding.designImplications} />
        </Section>
      </Group>
    </div>
  );
}
