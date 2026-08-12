"use client";

import { useState, type ReactNode } from "react";
import type {
  PlannedVisualAsset,
  VisualAssetPlan,
} from "@/lib/schemas/visual-asset-plan";

type VisualAssetPlanViewProps = {
  plan: VisualAssetPlan;
  creativeDirectionName?: string;
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

function AssetCard({ asset }: { asset: PlannedVisualAsset }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-t border-zinc-200 pt-4 dark:border-zinc-800">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-start justify-between gap-3 text-left"
        aria-expanded={open}
      >
        <div>
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            {asset.status} · {asset.priority} · {asset.type}
          </p>
          <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-50">
            {asset.name}
          </p>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {asset.purpose}
          </p>
        </div>
        <span className="shrink-0 text-xs text-zinc-500">
          {open ? "Hide" : "Expand"}
        </span>
      </button>

      {open ? (
        <div className="mt-4 space-y-3">
          <Field label="Product role">
            <p>{asset.productRole}</p>
          </Field>
          <Field label="Experience role">
            <p>{asset.experienceRole}</p>
          </Field>
          <Field label="Visual role">
            <p>{asset.visualRole}</p>
          </Field>
          <Field label="Placement">
            <p>{asset.placement}</p>
          </Field>
          <Field label="Composition">
            <p>{asset.composition}</p>
          </Field>
          <Field label="Subject">
            <p>{asset.subject}</p>
          </Field>
          <Field label="Environment">
            <p>{asset.environment}</p>
          </Field>
          <Field label="Mood">
            <p>{asset.mood}</p>
          </Field>
          <Field label="Imagery treatment">
            <p>{asset.imageryTreatment}</p>
          </Field>
          <Field label="Genome alignment">
            <p>{asset.genomeAlignment}</p>
          </Field>
          <Field label="Reference influence">
            <p>{asset.referenceInfluence || "None"}</p>
          </Field>
          <Field label="Generation brief">
            <p className="whitespace-pre-wrap">
              {asset.generationBrief.fullBrief}
            </p>
          </Field>
          <Field label="Brief details">
            <ul className="list-disc space-y-1 pl-5">
              <li>Subject: {asset.generationBrief.subject}</li>
              <li>Environment: {asset.generationBrief.environment}</li>
              <li>Composition: {asset.generationBrief.composition}</li>
              <li>Lighting: {asset.generationBrief.lighting}</li>
              <li>Atmosphere: {asset.generationBrief.atmosphere}</li>
              <li>Material: {asset.generationBrief.materialTexture}</li>
              <li>Style: {asset.generationBrief.visualStyle}</li>
              <li>UI relationship: {asset.generationBrief.relationshipToUi}</li>
            </ul>
          </Field>
          <Field label="Negative constraints">
            <List items={asset.negativeConstraints} />
          </Field>
          <Field label="Variants">
            {asset.variants.length === 0 ? (
              <p className="text-zinc-500">None</p>
            ) : (
              <ul className="list-disc space-y-2 pl-5">
                {asset.variants.map((variant) => (
                  <li key={variant.name}>
                    <span className="font-medium">{variant.name}</span>
                    {" — "}
                    {variant.whatChanges} ({variant.intent})
                  </li>
                ))}
              </ul>
            )}
          </Field>
          <Field label="Responsive behavior">
            <p>{asset.responsiveBehavior}</p>
          </Field>
          <Field label="Accessibility">
            <ul className="list-disc space-y-1 pl-5">
              <li>
                Role: {asset.accessibilityConsiderations.decorativeOrInformative}
              </li>
              <li>
                Alt-text intent: {asset.accessibilityConsiderations.altTextIntent}
              </li>
              <li>
                Text duplication:{" "}
                {asset.accessibilityConsiderations.textDuplication}
              </li>
              <li>
                Reduced motion: {asset.accessibilityConsiderations.reducedMotion}
              </li>
            </ul>
          </Field>
        </div>
      ) : null}
    </div>
  );
}

function AssetGroup({
  title,
  assets,
}: {
  title: string;
  assets: PlannedVisualAsset[];
}) {
  return (
    <Section title={title}>
      {assets.length === 0 ? (
        <p className="text-sm text-zinc-500">None</p>
      ) : (
        <div className="space-y-2">
          {assets.map((asset) => (
            <AssetCard key={asset.id} asset={asset} />
          ))}
        </div>
      )}
    </Section>
  );
}

export function VisualAssetPlanView({
  plan,
  creativeDirectionName,
}: VisualAssetPlanViewProps) {
  const required = plan.assets.filter((asset) => asset.status === "required");
  const recommended = plan.assets.filter(
    (asset) => asset.status === "recommended",
  );
  const optional = plan.assets.filter((asset) => asset.status === "optional");

  return (
    <div className="mt-6 space-y-2">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Visual asset plan
        </p>
        <p className="mt-1 text-sm text-zinc-500">
          Generation plans for
          {creativeDirectionName ? ` “${creativeDirectionName}”` : " the selected direction"}
          — not generated images or video.
        </p>
        <p className="mt-2 font-mono text-xs text-zinc-500">
          plan: {plan.id} · direction: {plan.creativeDirectionId} · genome:{" "}
          {plan.designGenomeId}
        </p>
      </div>

      <Section title="Strategy">
        <Field label="Visual approach">
          <p>{plan.strategy.visualApproach}</p>
        </Field>
        <Field label="Asset philosophy">
          <p>{plan.strategy.assetPhilosophy}</p>
        </Field>
        <Field label="Generation approach">
          <p>{plan.strategy.generationApproach}</p>
        </Field>
        <Field label="Restraint rules">
          <List items={plan.strategy.restraintRules} />
        </Field>
        <Field label="Consistency rules">
          <List items={plan.strategy.consistencyRules} />
        </Field>
      </Section>

      {plan.assets.length === 0 ? (
        <Section title="No generated assets">
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            {plan.noAssetsRationale ||
              "The planner decided generated imagery is not required."}
          </p>
        </Section>
      ) : null}

      <AssetGroup title="Required assets" assets={required} />
      <AssetGroup title="Recommended assets" assets={recommended} />
      <AssetGroup title="Optional assets" assets={optional} />

      <Section title="Rejected ideas">
        {plan.rejectedIdeas.length === 0 ? (
          <p className="text-sm text-zinc-500">None</p>
        ) : (
          <ul className="space-y-3">
            {plan.rejectedIdeas.map((item) => (
              <li key={item.idea} className="text-sm">
                <p className="font-medium text-zinc-900 dark:text-zinc-50">
                  {item.idea}
                </p>
                <p className="mt-1 text-zinc-600 dark:text-zinc-400">
                  {item.reason}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Global generation rules">
        <Field label="Visual consistency">
          <p>{plan.globalGenerationRules.visualConsistency}</p>
        </Field>
        <Field label="Palette behavior">
          <p>{plan.globalGenerationRules.paletteBehavior}</p>
        </Field>
        <Field label="Lighting behavior">
          <p>{plan.globalGenerationRules.lightingBehavior}</p>
        </Field>
        <Field label="Material behavior">
          <p>{plan.globalGenerationRules.materialBehavior}</p>
        </Field>
        <Field label="Composition behavior">
          <p>{plan.globalGenerationRules.compositionBehavior}</p>
        </Field>
        <Field label="Subject behavior">
          <p>{plan.globalGenerationRules.subjectBehavior}</p>
        </Field>
        <Field label="Realism behavior">
          <p>{plan.globalGenerationRules.realismBehavior}</p>
        </Field>
        <Field label="Typography behavior">
          <p>{plan.globalGenerationRules.typographyBehavior}</p>
        </Field>
        <Field label="Prohibited patterns">
          <List items={plan.globalGenerationRules.prohibitedPatterns} />
        </Field>
      </Section>

      <Section title="Asset relationships">
        {plan.assetRelationships.length === 0 ? (
          <p className="text-sm text-zinc-500">None</p>
        ) : (
          <ul className="list-disc space-y-2 pl-5 text-sm text-zinc-700 dark:text-zinc-300">
            {plan.assetRelationships.map((rel) => (
              <li key={`${rel.assetIds.join("-")}-${rel.relationship}`}>
                <span className="font-mono text-xs text-zinc-500">
                  [{rel.assetIds.join(", ")}]
                </span>{" "}
                {rel.relationship}
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
