import type { CreativeDirection } from "@/lib/schemas/creative-direction";
import type { DesignGenome } from "@/lib/schemas/design-genome";
import type { GeneratedImage } from "@/lib/schemas/generated-image";
import type { MotionPlan } from "@/lib/schemas/motion-plan";
import type { ProjectContext } from "@/lib/schemas/project-context";
import type { ProductUnderstanding } from "@/lib/schemas/product-understanding";
import type {
  PlannedVisualAsset,
  VisualAssetPlan,
} from "@/lib/schemas/visual-asset-plan";

export type CompileMotionPlanInput = {
  projectContext: ProjectContext;
  productUnderstanding: ProductUnderstanding;
  creativeDirection: CreativeDirection;
  designGenome: DesignGenome;
  visualAssetPlan: VisualAssetPlan;
  visualAsset: PlannedVisualAsset;
  generatedImage: GeneratedImage;
};

function createId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `motion-plan-${Date.now().toString(36)}`;
}

function joinSentences(parts: string[]): string {
  return parts
    .map((part) => part.replace(/\s+/g, " ").trim().replace(/[.]+$/, ""))
    .filter(Boolean)
    .join(". ")
    .concat(".");
}

function unique(items: string[], limit: number): string[] {
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

function shouldRequireGeneration(asset: PlannedVisualAsset): {
  requiresGeneration: boolean;
  skipReason: string;
} {
  switch (asset.type) {
    case "iconography":
      return {
        requiresGeneration: false,
        skipReason:
          "Iconography is better served by micro-interaction feedback than generated video.",
      };
    case "decorative":
      return {
        requiresGeneration: false,
        skipReason:
          "Decorative assets should not receive generated video unless they carry structural meaning.",
      };
    case "diagram":
      return {
        requiresGeneration: false,
        skipReason:
          "Diagrams benefit from staged UI state changes more than atmospheric video generation.",
      };
    case "hero":
    case "background":
    case "section-visual":
    case "transition":
    case "motion-visual":
    case "illustration":
    case "texture":
    case "other":
    default:
      return { requiresGeneration: true, skipReason: "" };
  }
}

/**
 * Builds a provider-agnostic image-to-video text prompt.
 * Uses upstream creative system + motion decisions — not a labeled MotionPlan dump.
 */
function compileImageToVideoGenerationBrief(input: {
  projectContext: ProjectContext;
  creativeDirection: CreativeDirection;
  designGenome: DesignGenome;
  visualAssetPlan: VisualAssetPlan;
  visualAsset: PlannedVisualAsset;
  generatedImage: GeneratedImage;
  motionLanguage: string;
  subjectMotion: string;
  cameraMotion: string;
  environmentMotion: string;
  transitionBehavior: string;
  timing: string;
  intensity: string;
  loopBehavior: string;
  negativeConstraints: string[];
}): string {
  const {
    projectContext,
    creativeDirection,
    designGenome,
    visualAssetPlan,
    visualAsset,
    generatedImage,
    motionLanguage,
    subjectMotion,
    cameraMotion,
    environmentMotion,
    transitionBehavior,
    timing,
    intensity,
    loopBehavior,
    negativeConstraints,
  } = input;

  const brief = visualAsset.generationBrief;
  const globals = visualAssetPlan.globalGenerationRules;
  const strategy = visualAssetPlan.strategy;

  const stillContext = generatedImage.prompt.replace(/\s+/g, " ").trim().slice(0, 420);

  const rejectedAvoid = unique(
    visualAssetPlan.rejectedIdeas.map(
      (item) => `Do not introduce “${item.idea}” (${item.reason})`,
    ),
    4,
  );

  const avoidList = unique(
    [
      ...negativeConstraints,
      ...globals.prohibitedPatterns,
      ...rejectedAvoid,
      ...strategy.restraintRules.map((rule) => `Respect restraint: ${rule}`),
    ],
    16,
  );

  const sections = [
    [
      "SOURCE FRAME",
      `Animate the supplied generated still for asset “${visualAsset.name}” in project “${projectContext.name}”.`,
      "Treat that image as the authoritative source frame.",
      "Preserve its visual identity, composition, and major environmental structure while introducing only purposeful motion.",
      stillContext
        ? `Source still generation context: ${stillContext}`
        : "Source still generation context: use the supplied image pixels as ground truth.",
    ].join("\n"),

    [
      "PRESERVE",
      `Keep major foreground structure and readable hierarchy stable so product meaning stays clear.`,
      `Preserve subject identity: ${brief.subject}.`,
      `Preserve environment identity: ${brief.environment}.`,
      `Preserve composition intent: ${brief.composition}.`,
      `Preserve lighting character: ${brief.lighting}.`,
      `Preserve atmosphere: ${brief.atmosphere}.`,
      `Preserve material/texture character: ${brief.materialTexture}.`,
      `Preserve visual style: ${brief.visualStyle}.`,
      `Respect UI relationship: ${brief.relationshipToUi}.`,
      `Do not deform, replace, or restyle the source into a different scene.`,
      `Signature to protect: ${designGenome.distinctiveSignature.statement}.`,
    ].join("\n"),

    [
      "ANIMATE",
      `Motion exists to support: ${designGenome.motion.purpose}.`,
      `Spatial intent: ${designGenome.spatialBehavior.philosophy}.`,
      `Only animate layers that reinforce that purpose.`,
      subjectMotion,
      environmentMotion,
      `Staged reveal: ${transitionBehavior}`,
      `Depth relationships while moving: ${designGenome.spatialBehavior.relationships.slice(0, 3).join("; ")}.`,
      "Do not invent unrelated object motion, particle systems, or decorative effects.",
    ].join("\n"),

    [
      "CAMERA",
      "Preserve the source framing; do not reframe into a new shot.",
      `Camera direction and movement: ${designGenome.motion.transitions}`,
      cameraMotion,
      "Prefer controlled spatial movement that supports progression/reveal. Do not use dramatic zoom, shake, or spectacle orbits.",
    ].join("\n"),

    [
      "MOTION CHARACTER",
      `Creative direction “${creativeDirection.name}”: ${creativeDirection.coreConcept}`,
      `Direction motion approach: ${creativeDirection.motionApproach}`,
      `Genome motion character: ${designGenome.motion.character}`,
      `Combined motion language: ${motionLanguage}`,
      `Interaction/feedback character for motion: ${designGenome.motion.feedback}`,
    ].join("\n"),

    [
      "TIMING",
      `Pacing: ${timing}`,
      `Intensity: ${intensity}`,
      `Loop behavior: ${loopBehavior}`,
      "Motion should feel gradual and purposeful — never frantic or constantly attention-seeking.",
    ].join("\n"),

    [
      "VISUAL CONTINUITY",
      `Asset plan approach: ${strategy.visualApproach}`,
      `Asset philosophy: ${strategy.assetPhilosophy}`,
      `Generation approach: ${strategy.generationApproach}`,
      `Consistency: ${strategy.consistencyRules.slice(0, 2).join("; ")}`,
      `Global visual consistency: ${globals.visualConsistency}`,
      `Palette behavior: ${globals.paletteBehavior}`,
      `Lighting behavior: ${globals.lightingBehavior}`,
      `Material behavior: ${globals.materialBehavior}`,
      `Composition behavior: ${globals.compositionBehavior}`,
      `Subject behavior: ${globals.subjectBehavior}`,
      `Realism behavior: ${globals.realismBehavior}`,
      `Typography in motion: ${globals.typographyBehavior}`,
      `Full still brief continuity: ${brief.fullBrief}`,
    ].join("\n"),

    [
      "AVOID",
      ...avoidList.map((item) => `- ${item}`),
      "- Do not add epic cinematic camera language, dramatic zoom, dynamic generic movement, particles, lens flares, floating dust, or random environmental motion unless the upstream creative system explicitly requires them.",
    ].join("\n"),
  ];

  return sections.join("\n\n");
}

/**
 * Deterministic MotionPlan compiler.
 * NOT an LLM call — derives motion from Creative Agent outputs.
 */
export function compileMotionPlan(input: CompileMotionPlanInput): MotionPlan {
  const {
    projectContext,
    productUnderstanding,
    creativeDirection,
    designGenome,
    visualAssetPlan,
    visualAsset,
    generatedImage,
  } = input;

  const { requiresGeneration, skipReason } = shouldRequireGeneration(visualAsset);

  const motionLanguage = [designGenome.motion.character, creativeDirection.motionApproach]
    .map((value) => value.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .filter((value, index, arr) => arr.findIndex((item) => item.toLowerCase() === value.toLowerCase()) === index)
    .join(" — ");

  const concept = joinSentences([
    designGenome.motion.purpose,
    designGenome.spatialBehavior.philosophy,
  ]);

  const purpose = joinSentences([
    `Support “${creativeDirection.name}” for asset “${visualAsset.name}”`,
    visualAsset.purpose,
    `Product journey: ${productUnderstanding.userJourney.during}`,
  ]);

  const subjectMotion = joinSentences([
    `Subject remains largely stable so product meaning stays readable; only allow movement that reinforces: ${designGenome.motion.purpose}`,
    `Subject from the still: ${visualAsset.subject}`,
  ]);

  const cameraMotion = joinSentences([
    `Camera/viewpoint motion must stay restrained and purposeful: ${designGenome.motion.transitions}`,
    `Spatial rule: ${designGenome.spatialBehavior.philosophy}`,
    "Do not invent dramatic zooms or shakes",
  ]);

  const environmentMotion = joinSentences([
    `Environment may evolve only as: ${designGenome.motion.character}`,
    `Placement context: ${visualAsset.placement}`,
    `Composition: ${visualAsset.composition}`,
  ]);

  const transitionBehavior = designGenome.motion.transitions;

  const timing = joinSentences([
    designGenome.densityAndRhythm.pacing,
    ...designGenome.motion.principles.slice(0, 2),
  ]);

  const intensity = joinSentences([
    "Intensity stays restrained so UI content remains primary",
    `Genome feedback character: ${designGenome.motion.feedback}`,
    `Asset plan restraint: ${visualAssetPlan.strategy.restraintRules[0] ?? "avoid decorative motion"}`,
  ]);

  const loopBehavior =
    visualAsset.type === "hero" || visualAsset.type === "background"
      ? "If looping, use a calm continuous atmospheric loop that never demands attention or resets jarringly."
      : "Prefer a single purposeful reveal/settle rather than a continuous spectacle loop.";

  const interactionRole = joinSentences([
    `Motion is atmospheric support for ${visualAsset.productRole}, not a replacement for interaction`,
    `Interaction character: ${designGenome.interaction.character}`,
  ]);

  const negativeConstraints = unique(
    [
      ...designGenome.motion.principles.map((p) => `Respect motion principle: ${p}`),
      ...designGenome.implementationGuardrails.mustAvoid,
      ...creativeDirection.antiPatterns,
      ...visualAsset.negativeConstraints,
      ...visualAssetPlan.globalGenerationRules.prohibitedPatterns,
      ...designGenome.accessibilityPrinciples.motion,
      "No random camera shake",
      "No excessive zoom",
      "No floating particles unless required by the genome",
      "No neon trails",
      "No lens flares",
      "No generic cinematic effects",
      "No perpetual bouncing parallax",
      "No random object movement",
      "No excessive slow motion",
    ],
    12,
  );

  const generationBrief = compileImageToVideoGenerationBrief({
    projectContext,
    creativeDirection,
    designGenome,
    visualAssetPlan,
    visualAsset,
    generatedImage,
    motionLanguage,
    subjectMotion,
    cameraMotion,
    environmentMotion,
    transitionBehavior,
    timing,
    intensity,
    loopBehavior,
    negativeConstraints,
  });

  return {
    id: createId(),
    assetId: visualAsset.id,
    creativeDirectionId: creativeDirection.id,
    designGenomeId: designGenome.id,
    concept,
    purpose,
    motionLanguage,
    subjectMotion,
    cameraMotion,
    environmentMotion,
    transitionBehavior,
    timing,
    intensity,
    loopBehavior,
    interactionRole,
    negativeConstraints,
    generationBrief,
    requiresGeneration,
    skipReason,
  };
}
