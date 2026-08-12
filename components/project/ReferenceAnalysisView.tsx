import type { ReactNode } from "react";
import type { ReferenceAnalysis } from "@/lib/schemas/reference-analysis";

type ReferenceAnalysisViewProps = {
  analysis: ReferenceAnalysis;
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

export function ReferenceAnalysisView({
  analysis,
}: ReferenceAnalysisViewProps) {
  return (
    <div className="mt-6 space-y-6 border-t border-zinc-200 pt-6 dark:border-zinc-800">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          AI-generated reference analysis
        </p>
        <p className="mt-1 text-sm text-zinc-500">
          Image intelligence only. Principles to learn from — not a design
          system to copy.
        </p>
        <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
          {analysis.overallCharacter}
        </p>
      </div>

      <Section title="What we see">
        <ul className="space-y-3">
          {analysis.observations.map((item) => (
            <li key={`${item.category}-${item.observation}`}>
              <p className="text-xs uppercase tracking-wide text-zinc-500">
                {item.category}
              </p>
              <p className="mt-1">{item.observation}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Why it works">
        <ul className="space-y-3">
          {analysis.interpretations.map((item) => (
            <li key={`${item.observation}-${item.meaning}`}>
              <p className="font-medium text-zinc-800 dark:text-zinc-200">
                {item.observation}
              </p>
              <p className="mt-1">{item.meaning}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Creative principles">
        <ul className="space-y-3">
          {analysis.creativePrinciples.map((item) => (
            <li key={item.principle}>
              <p className="font-medium text-zinc-800 dark:text-zinc-200">
                {item.principle}
              </p>
              <p className="mt-1">{item.rationale}</p>
              <p className="mt-1 text-xs uppercase tracking-wide text-zinc-500">
                Confidence: {item.confidence}
              </p>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Transferable qualities">
        <List items={analysis.transferableQualities} />
      </Section>

      <Section title="Why it may fit this product">
        {analysis.productAlignment.length === 0 ? (
          <p className="text-zinc-500">
            No forced product alignment. The reference may still be useful as
            general creative intelligence.
          </p>
        ) : (
          <ul className="space-y-3">
            {analysis.productAlignment.map((item) => (
              <li key={`${item.referenceSignal}-${item.productConnection}`}>
                <p className="font-medium text-zinc-800 dark:text-zinc-200">
                  {item.referenceSignal}
                </p>
                <p className="mt-1">{item.productConnection}</p>
                <p className="mt-1 text-xs uppercase tracking-wide text-zinc-500">
                  Relevance: {item.relevance}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="What not to copy">
        <List items={analysis.avoidCopying} />
      </Section>
    </div>
  );
}
