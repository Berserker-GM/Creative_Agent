import { z } from "zod";

export const ConfidenceSchema = z.enum(["low", "medium", "high"]);

export const ObservationSchema = z.object({
  category: z
    .string()
    .min(1)
    .describe(
      "Observation category, e.g. composition, hierarchy, typography, space, contrast, pacing.",
    ),
  observation: z
    .string()
    .min(1)
    .describe("What is actually visible in the reference — not why it works."),
});

export const InterpretationSchema = z.object({
  observation: z
    .string()
    .min(1)
    .describe("The visible cue being interpreted."),
  meaning: z
    .string()
    .min(1)
    .describe(
      "The design/experience effect that cue appears to create — careful inference, not invented research.",
    ),
});

export const CreativePrincipleSchema = z.object({
  principle: z
    .string()
    .min(1)
    .describe(
      "A transferable creative principle that could be reused elsewhere — not a copy instruction.",
    ),
  rationale: z
    .string()
    .min(1)
    .describe("Why this principle appears effective based on the reference."),
  confidence: ConfidenceSchema.describe(
    "Confidence that the principle is supported by what is visible.",
  ),
});

export const ProductAlignmentSchema = z.object({
  referenceSignal: z
    .string()
    .min(1)
    .describe("The reference-derived signal or principle being considered."),
  productConnection: z
    .string()
    .min(1)
    .describe(
      "Why that signal could matter for THIS product, grounded in ProjectContext.",
    ),
  relevance: ConfidenceSchema.describe(
    "How strongly the connection fits this product. Prefer omitting forced alignments.",
  ),
});

/**
 * Analysis of an image reference.
 * Answers what can be learned — not what the product's design system should become.
 */
export const ReferenceAnalysisSchema = z.object({
  referenceId: z.string().min(1),
  observations: z.array(ObservationSchema).min(1),
  interpretations: z.array(InterpretationSchema).min(1),
  creativePrinciples: z.array(CreativePrincipleSchema).min(1),
  transferableQualities: z.array(z.string().min(1)).min(1),
  productAlignment: z.array(ProductAlignmentSchema).default([]),
  avoidCopying: z.array(z.string().min(1)).min(1),
  overallCharacter: z
    .string()
    .min(1)
    .describe(
      "A concise reading of the reference's overall creative character.",
    ),
});

export type Observation = z.infer<typeof ObservationSchema>;
export type Interpretation = z.infer<typeof InterpretationSchema>;
export type CreativePrinciple = z.infer<typeof CreativePrincipleSchema>;
export type ProductAlignment = z.infer<typeof ProductAlignmentSchema>;
export type ReferenceAnalysis = z.infer<typeof ReferenceAnalysisSchema>;
