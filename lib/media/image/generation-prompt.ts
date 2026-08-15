import { IMAGE_PROMPT_MAX_LENGTH } from "@/lib/media/image/config";
import type { CreativeDirection } from "@/lib/schemas/creative-direction";
import type { DesignGenome } from "@/lib/schemas/design-genome";
import type { ProjectContext } from "@/lib/schemas/project-context";
import type { ProductUnderstanding } from "@/lib/schemas/product-understanding";
import type { ReferenceAnalysis } from "@/lib/schemas/reference-analysis";
import type {
  PlannedVisualAsset,
  VisualAssetPlan,
} from "@/lib/schemas/visual-asset-plan";

export type CompileImagePromptInput = {
  projectContext: ProjectContext;
  productUnderstanding: ProductUnderstanding;
  creativeDirection: CreativeDirection;
  designGenome: DesignGenome;
  visualAssetPlan: VisualAssetPlan;
  visualAsset: PlannedVisualAsset;
  referenceAnalyses?: ReferenceAnalysis[];
};

function clip(text: string, max: number): string {
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trimEnd()}…`;
}

function uniqueItems(items: string[], limit: number): string[] {
  const seen = new Set<string>();
  const out: string[] = [];

  for (const item of items) {
    const value = item.replace(/\s+/g, " ").trim();
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
    if (out.length >= limit) break;
  }

  return out;
}

function collectReferencePrinciples(
  references: ReferenceAnalysis[] | undefined,
  asset: PlannedVisualAsset,
): string[] {
  const fromAsset = asset.referenceInfluence?.trim()
    ? [asset.referenceInfluence.trim()]
    : [];

  if (!references || references.length === 0) {
    return fromAsset;
  }

  const principles: string[] = [...fromAsset];

  for (const analysis of references) {
    for (const item of analysis.creativePrinciples) {
      principles.push(item.principle);
    }
    for (const quality of analysis.transferableQualities) {
      principles.push(quality);
    }
  }

  return uniqueItems(principles, 4);
}

function collectAvoidances(input: CompileImagePromptInput): string[] {
  const { visualAsset, visualAssetPlan, designGenome, productUnderstanding } =
    input;

  return uniqueItems(
    [
      ...visualAsset.negativeConstraints,
      ...visualAssetPlan.globalGenerationRules.prohibitedPatterns,
      ...designGenome.implementationGuardrails.mustAvoid,
      ...visualAssetPlan.rejectedIdeas.map((idea) => idea.idea),
      ...productUnderstanding.visualRisks,
      ...productUnderstanding.antiPatterns,
      "website screenshot",
      "UI cards",
      "generic SaaS hero graphic",
      "embedded text or logos",
      "random decorative objects",
    ],
    10,
  );
}

/**
 * Deterministic generation-prompt compiler.
 * NOT an LLM call — converts Creative Agent outputs into one coherent image brief.
 * Must stay within FLUX prompt limits (2048 chars).
 */
export function compileImageGenerationPrompt(
  input: CompileImagePromptInput,
): string {
  const {
    projectContext,
    productUnderstanding,
    creativeDirection,
    designGenome,
    visualAssetPlan,
    visualAsset,
  } = input;

  const references = collectReferencePrinciples(
    input.referenceAnalyses,
    visualAsset,
  );
  const avoid = collectAvoidances(input);

  const what = clip(
    `${visualAsset.subject}. Environment: ${visualAsset.environment}. Treatment: ${visualAsset.imageryTreatment}.`,
    320,
  );

  const why = clip(
    `For product “${projectContext.name}”: ${visualAsset.purpose}. Product tension: ${productUnderstanding.coreTension}. Direction “${creativeDirection.name}”: ${creativeDirection.coreConcept}.`,
    360,
  );

  const how = clip(
    `Placement: ${visualAsset.placement}. Composition: ${visualAsset.composition}. Leave clear negative space and a quiet focal hierarchy so website UI content can overlay without competition. Mood: ${visualAsset.mood}.`,
    320,
  );

  const language = clip(
    `Visual DNA: ${designGenome.visualDNA.character}. Imagery: ${designGenome.imagery.role}; ${designGenome.imagery.treatment}. Depth/material: ${designGenome.depthAndMaterial.character}; ${designGenome.depthAndMaterial.surfaceBehavior}. Color: ${designGenome.color.philosophy}. Spatial: ${designGenome.spatialBehavior.philosophy}. Signature: ${designGenome.distinctiveSignature.statement}. Asset plan approach: ${visualAssetPlan.strategy.visualApproach}.`,
    480,
  );

  const referenceBlock =
    references.length > 0
      ? `Use only transferable principles (do not copy any reference composition/subject/typography/palette): ${references.join("; ")}.`
      : "No reference copying; invent from the direction and genome only.";

  const avoidBlock = `Avoid: ${avoid.join("; ")}.`;

  let prompt = [
    "Create one website visual asset, not a standalone poster and not a UI mockup.",
    `WHAT: ${what}`,
    `WHY: ${why}`,
    `HOW: ${how}`,
    `VISUAL LANGUAGE: ${language}`,
    `REFERENCES: ${clip(referenceBlock, 220)}`,
    avoidBlock,
  ].join("\n");

  if (prompt.length > IMAGE_PROMPT_MAX_LENGTH) {
    prompt = prompt.slice(0, IMAGE_PROMPT_MAX_LENGTH - 1).trimEnd() + "…";
  }

  return prompt;
}
