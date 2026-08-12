import { z } from "zod";

/**
 * A conceptual creative direction for a product.
 * Not a DesignGenome and not an implementation spec.
 */
export const CreativeDirectionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).describe("Short distinctive name for the direction."),
  tagline: z
    .string()
    .min(1)
    .describe("One-sentence creative positioning for this direction."),
  coreConcept: z
    .string()
    .min(1)
    .describe(
      "The central creative idea/metaphor. Must be a concept, not a style label like 'modern SaaS'.",
    ),
  productFit: z
    .string()
    .min(1)
    .describe(
      "Why this concept specifically fits THIS product — grounded in product tension/journey, not generic praise.",
    ),
  experience: z
    .string()
    .min(1)
    .describe("How the product should feel/behave as an experience under this concept."),
  visualLanguage: z
    .array(z.string().min(1))
    .min(1)
    .describe(
      "Visual qualities (hierarchy, density, depth, progression, etc.) — not hex codes, fonts, or CSS.",
    ),
  compositionApproach: z
    .string()
    .min(1)
    .describe("How space, hierarchy, and structure should be organized conceptually."),
  imageryApproach: z
    .string()
    .min(1)
    .describe("Imagery strategy as a concept — not asset prompts or stock instructions."),
  motionApproach: z
    .string()
    .min(1)
    .describe(
      "Character of motion/behavior — not library names or animation recipes.",
    ),
  interactionCharacter: z
    .string()
    .min(1)
    .describe("How interaction should feel under this direction."),
  referenceInfluences: z
    .array(z.string())
    .default([])
    .describe(
      "Transferable principles borrowed from references, if any. Never copy layout/colors/assets.",
    ),
  distinctiveQuality: z
    .string()
    .min(1)
    .describe(
      "What would make the product visually recognizable if this direction were implemented.",
    ),
  risks: z
    .array(z.string().min(1))
    .min(1)
    .describe("Where this concept could fail for the product."),
  antiPatterns: z
    .array(z.string().min(1))
    .min(1)
    .describe("What implementation should avoid for this direction."),
});

export const CreativeDirectionsResultSchema = z.object({
  creativeDirections: z
    .array(CreativeDirectionSchema)
    .length(4)
    .describe("Exactly four meaningfully different creative directions."),
});

export type CreativeDirection = z.infer<typeof CreativeDirectionSchema>;
export type CreativeDirectionsResult = z.infer<
  typeof CreativeDirectionsResultSchema
>;
