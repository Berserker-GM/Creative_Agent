import { z } from "zod";

/**
 * DesignGenome — visual/experiential DNA derived from a selected CreativeDirection.
 * Principles and character only. Not a token dump. Not frontend code.
 */

const stringList = z.array(z.string().min(1)).min(1);

export const VisualDNASchema = z.object({
  character: z
    .string()
    .min(1)
    .describe("Overall visual character of the product under this genome."),
  principles: stringList.describe(
    "Core visual principles that must remain true throughout the experience.",
  ),
});

export const TypographyGenomeSchema = z.object({
  character: z
    .string()
    .min(1)
    .describe("How typography should behave — not a font-family pick."),
  hierarchy: z
    .string()
    .min(1)
    .describe("How type levels establish orientation and meaning."),
  role: z
    .string()
    .min(1)
    .describe("What typography is responsible for in this experience."),
  principles: stringList.describe("Typography behavior rules."),
});

export const ColorGenomeSchema = z.object({
  philosophy: z
    .string()
    .min(1)
    .describe("Emotional/structural role of color — not a fashionable palette dump."),
  hierarchy: z
    .string()
    .min(1)
    .describe("How color ranks background, content, and emphasis."),
  emphasis: z
    .string()
    .min(1)
    .describe("What earns chromatic emphasis and why."),
  principles: stringList.describe("Color behavior rules."),
});

export const CompositionGenomeSchema = z.object({
  philosophy: z
    .string()
    .min(1)
    .describe("Compositional idea derived from the Creative Direction."),
  hierarchy: z
    .string()
    .min(1)
    .describe("How visual hierarchy is created through arrangement."),
  principles: stringList.describe("Composition rules."),
});

export const SpatialBehaviorSchema = z.object({
  philosophy: z
    .string()
    .min(1)
    .describe("How space should behave and feel."),
  relationships: stringList.describe(
    "Key spatial relationships (foreground/background, stage/detail, etc.).",
  ),
  principles: stringList.describe("Spatial behavior rules."),
});

export const ImageryGenomeSchema = z.object({
  role: z
    .string()
    .min(1)
    .describe("What imagery is for in this experience."),
  subjectStrategy: z
    .string()
    .min(1)
    .describe("What subjects/themes imagery should pursue."),
  treatment: z
    .string()
    .min(1)
    .describe("How imagery should be treated visually."),
  principles: stringList.describe(
    "Imagery rules including when imagery should NOT be used.",
  ),
});

export const DepthAndMaterialSchema = z.object({
  character: z
    .string()
    .min(1)
    .describe("Depth/material character — flat, layered, environmental, etc."),
  layering: z
    .string()
    .min(1)
    .describe("How layers relate conceptually."),
  surfaceBehavior: z
    .string()
    .min(1)
    .describe("Surface character without CSS shadow/blur recipes."),
  principles: stringList.describe("Depth and material rules."),
});

export const MotionGenomeSchema = z.object({
  character: z
    .string()
    .min(1)
    .describe("Motion personality — not library names."),
  purpose: z
    .string()
    .min(1)
    .describe("Why motion exists for this concept."),
  transitions: z
    .string()
    .min(1)
    .describe("How transitions should behave and what they communicate."),
  feedback: z
    .string()
    .min(1)
    .describe("How motion supports interaction feedback."),
  principles: stringList.describe("Motion rules including what to avoid."),
});

export const InteractionGenomeSchema = z.object({
  character: z
    .string()
    .min(1)
    .describe("How interaction should feel under this direction."),
  navigation: z
    .string()
    .min(1)
    .describe("Navigation model supporting the Creative Direction."),
  feedback: z
    .string()
    .min(1)
    .describe("Feedback for progress, confirmation, and errors."),
  principles: stringList.describe("Interaction rules."),
});

export const DensityAndRhythmSchema = z.object({
  informationDensity: z
    .string()
    .min(1)
    .describe("How dense information should feel."),
  pacing: z
    .string()
    .min(1)
    .describe("How the experience paces attention over time."),
  whitespace: z
    .string()
    .min(1)
    .describe("Role of emptiness/breathing room."),
  principles: stringList.describe("Density and rhythm rules."),
});

export const ResponsiveBehaviorSchema = z.object({
  philosophy: z
    .string()
    .min(1)
    .describe("What must survive when space decreases — not 'make it responsive'."),
  priorities: stringList.describe(
    "What remains dominant as viewport/space shrinks.",
  ),
  transformations: stringList.describe(
    "How structure may transform without losing the concept.",
  ),
});

export const AccessibilityPrinciplesSchema = z.object({
  readability: stringList.describe("Readability and contrast principles."),
  interaction: stringList.describe(
    "Clear interaction/accessibility principles including non-color indicators.",
  ),
  motion: stringList.describe(
    "Motion accessibility including reduced-motion behavior.",
  ),
});

export const ImplementationGuardrailsSchema = z.object({
  mustPreserve: stringList.describe(
    "Qualities a future frontend agent must preserve.",
  ),
  mustAvoid: stringList.describe(
    "Patterns a future frontend agent must avoid.",
  ),
});

export const DistinctiveSignatureSchema = z.object({
  statement: z
    .string()
    .min(1)
    .describe(
      "Specific recognizable character — not 'modern, clean, premium'.",
    ),
  recognizableTraits: stringList.describe(
    "Concrete traits that would make the product recognizable.",
  ),
});

export const FailureModesSchema = z.object({
  visual: stringList.describe("Ways the visuals can fail the concept."),
  product: stringList.describe(
    "Ways the genome can undermine the actual product goals.",
  ),
  implementation: stringList.describe(
    "Ways implementation can collapse the concept into generic UI.",
  ),
});

export const DesignGenomeSchema = z.object({
  id: z.string().min(1),
  creativeDirectionId: z
    .string()
    .min(1)
    .describe("ID of the selected CreativeDirection this genome derives from."),
  visualDNA: VisualDNASchema,
  typography: TypographyGenomeSchema,
  color: ColorGenomeSchema,
  composition: CompositionGenomeSchema,
  spatialBehavior: SpatialBehaviorSchema,
  imagery: ImageryGenomeSchema,
  depthAndMaterial: DepthAndMaterialSchema,
  motion: MotionGenomeSchema,
  interaction: InteractionGenomeSchema,
  densityAndRhythm: DensityAndRhythmSchema,
  responsiveBehavior: ResponsiveBehaviorSchema,
  accessibilityPrinciples: AccessibilityPrinciplesSchema,
  implementationGuardrails: ImplementationGuardrailsSchema,
  distinctiveSignature: DistinctiveSignatureSchema,
  failureModes: FailureModesSchema,
});

export type DesignGenome = z.infer<typeof DesignGenomeSchema>;
export type VisualDNA = z.infer<typeof VisualDNASchema>;
export type TypographyGenome = z.infer<typeof TypographyGenomeSchema>;
export type ColorGenome = z.infer<typeof ColorGenomeSchema>;
export type CompositionGenome = z.infer<typeof CompositionGenomeSchema>;
export type SpatialBehavior = z.infer<typeof SpatialBehaviorSchema>;
export type ImageryGenome = z.infer<typeof ImageryGenomeSchema>;
export type DepthAndMaterial = z.infer<typeof DepthAndMaterialSchema>;
export type MotionGenome = z.infer<typeof MotionGenomeSchema>;
export type InteractionGenome = z.infer<typeof InteractionGenomeSchema>;
export type DensityAndRhythm = z.infer<typeof DensityAndRhythmSchema>;
export type ResponsiveBehavior = z.infer<typeof ResponsiveBehaviorSchema>;
export type AccessibilityPrinciples = z.infer<
  typeof AccessibilityPrinciplesSchema
>;
export type ImplementationGuardrails = z.infer<
  typeof ImplementationGuardrailsSchema
>;
export type DistinctiveSignature = z.infer<typeof DistinctiveSignatureSchema>;
export type FailureModes = z.infer<typeof FailureModesSchema>;
