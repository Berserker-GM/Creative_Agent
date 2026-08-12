import { z } from "zod";

export const UserJourneySchema = z.object({
  before: z
    .string()
    .min(1)
    .describe(
      "The user's meaningful state before the product — emotional/cognitive, not a UI action.",
    ),
  during: z
    .string()
    .min(1)
    .describe(
      "The user's meaningful state while using the product — what changes in focus or capability.",
    ),
  after: z
    .string()
    .min(1)
    .describe(
      "The user's meaningful state after sustained use — the transformation the product enables.",
    ),
});

/**
 * AI-derived product understanding.
 * Describes WHAT the product means — not how it should look/feel (DesignGenome).
 */
export const ProductUnderstandingSchema = z.object({
  coreProblem: z
    .string()
    .min(1)
    .describe(
      "The central problem the product addresses, stated specifically for this product — not a category cliché.",
    ),
  productPurpose: z
    .string()
    .min(1)
    .describe("What the product exists to do for its users."),
  targetAudience: z
    .string()
    .min(1)
    .describe("Who the product is primarily for, grounded in the context."),
  userNeeds: z
    .array(z.string().min(1))
    .min(1)
    .describe(
      "Concrete user needs inferred from the project context — specific, not generic category needs.",
    ),
  emotionalGoals: z
    .array(z.string().min(1))
    .min(1)
    .describe(
      "How users should feel when using the product, tied to this product's tension and journey.",
    ),
  brandPersonality: z
    .array(z.string().min(1))
    .min(1)
    .describe(
      "Personality traits that fit this product's intent and tone — avoid empty brand adjectives.",
    ),
  differentiators: z
    .array(z.string().min(1))
    .min(1)
    .describe(
      "What makes this product distinct from generic alternatives in its category.",
    ),
  coreTension: z
    .string()
    .min(1)
    .describe(
      "The central contrast the product resolves or manages. Prefer a meaningful tension over a vague need statement.",
    ),
  userJourney: UserJourneySchema.describe(
    "Meaningful before/during/after states — not a list of UI clicks.",
  ),
  experiencePrinciples: z
    .array(z.string().min(1))
    .min(1)
    .describe(
      "Principles the product experience should embody. Not visual design rules (typography, cards, colors).",
    ),
  antiPatterns: z
    .array(z.string().min(1))
    .min(1)
    .describe(
      "Generic product/experience patterns that would undermine this product's specific identity or purpose.",
    ),
  visualOpportunities: z
    .array(z.string().min(1))
    .min(1)
    .describe(
      "Opportunities derived from product structure and meaning for a later creative stage — not a design system, palette, or component list.",
    ),
  visualRisks: z
    .array(z.string().min(1))
    .min(1)
    .describe(
      "Clichés or directions that would make this product feel generic or undermine its purpose.",
    ),
  designImplications: z
    .array(z.string().min(1))
    .min(1)
    .describe(
      "Strategic implications for later creative direction — never CSS, components, layouts, or motion specs.",
    ),
});

export type UserJourney = z.infer<typeof UserJourneySchema>;
export type ProductUnderstanding = z.infer<typeof ProductUnderstandingSchema>;
