import { z } from "zod";

/**
 * Visual Asset Plan — which assets the frontend needs, why, and how to generate them.
 * Plans only. Not image/video generation. Not frontend code.
 */

const stringList = z.array(z.string().min(1)).min(1);

export const VisualAssetTypeSchema = z.enum([
  "hero",
  "background",
  "section-visual",
  "illustration",
  "diagram",
  "decorative",
  "texture",
  "iconography",
  "transition",
  "motion-visual",
  "other",
]);

export const VisualAssetStatusSchema = z.enum([
  "required",
  "recommended",
  "optional",
]);

export const VisualAssetPrioritySchema = z.enum([
  "critical",
  "high",
  "medium",
  "low",
]);

export const AssetVariantSchema = z.object({
  name: z.string().min(1).describe("Short name for this variant direction."),
  whatChanges: z
    .string()
    .min(1)
    .describe("What meaningful creative decision changes vs other variants."),
  intent: z
    .string()
    .min(1)
    .describe("Why this variant is worth considering for the product."),
});

export const GenerationBriefSchema = z.object({
  subject: z.string().min(1),
  environment: z.string().min(1),
  composition: z.string().min(1),
  lighting: z.string().min(1),
  atmosphere: z.string().min(1),
  materialTexture: z.string().min(1),
  visualStyle: z.string().min(1),
  relationshipToUi: z
    .string()
    .min(1)
    .describe("How the asset should relate to interface content."),
  fullBrief: z
    .string()
    .min(1)
    .describe(
      "Complete generator-agnostic brief a future image model can use. Do not name specific generators.",
    ),
});

export const AssetAccessibilitySchema = z.object({
  decorativeOrInformative: z
    .string()
    .min(1)
    .describe("Whether the asset is decorative or informative."),
  altTextIntent: z
    .string()
    .min(1)
    .describe("What alt text should communicate if the asset is informative."),
  textDuplication: z
    .string()
    .min(1)
    .describe("Whether critical information must also exist in text/UI."),
  reducedMotion: z
    .string()
    .min(1)
    .describe("Reduced-motion implications if the asset involves motion."),
});

export const PlannedVisualAssetSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: VisualAssetTypeSchema,
  status: VisualAssetStatusSchema,
  priority: VisualAssetPrioritySchema,
  purpose: z
    .string()
    .min(1)
    .describe(
      "Why this asset exists for THIS product experience — not 'to look beautiful'.",
    ),
  productRole: z
    .string()
    .min(1)
    .describe(
      "Product function: orientation, progression, technical relationship, stage differentiation, etc.",
    ),
  experienceRole: z
    .string()
    .min(1)
    .describe(
      "What the user should experience and HOW the asset produces that effect.",
    ),
  visualRole: z
    .string()
    .min(1)
    .describe("What the asset contributes to the visual system."),
  placement: z
    .string()
    .min(1)
    .describe("Where the asset belongs conceptually — not CSS coordinates."),
  composition: z
    .string()
    .min(1)
    .describe(
      "Subject placement, focal area, negative space, direction, scale, UI relationship.",
    ),
  subject: z
    .string()
    .min(1)
    .describe("What should appear — concepts over forced literal metaphors."),
  environment: z.string().min(1),
  mood: z
    .string()
    .min(1)
    .describe("Emotional/perceptual tone — not 'modern, premium, beautiful'."),
  imageryTreatment: z
    .string()
    .min(1)
    .describe(
      "Realism/abstraction, photo vs illustration, texture, contrast, lighting, material, fidelity.",
    ),
  genomeAlignment: z
    .string()
    .min(1)
    .describe("How this asset follows the DesignGenome."),
  referenceInfluence: z
    .string()
    .default("")
    .describe(
      "Transferred reference principle + transformation + why. Empty if none.",
    ),
  generationBrief: GenerationBriefSchema,
  negativeConstraints: stringList.describe(
    "Explicit things this asset must avoid, derived from genome/product.",
  ),
  variants: z
    .array(AssetVariantSchema)
    .default([])
    .describe(
      "For important assets, 3–4 meaningfully different creative variants — not color swaps.",
    ),
  responsiveBehavior: z
    .string()
    .min(1)
    .describe("What happens when viewport space decreases — not CSS."),
  accessibilityConsiderations: AssetAccessibilitySchema,
});

export const AssetPlanStrategySchema = z.object({
  visualApproach: z.string().min(1),
  assetPhilosophy: z.string().min(1),
  restraintRules: stringList,
  consistencyRules: stringList,
  generationApproach: z.string().min(1),
});

export const GlobalGenerationRulesSchema = z.object({
  visualConsistency: z.string().min(1),
  paletteBehavior: z.string().min(1),
  lightingBehavior: z.string().min(1),
  materialBehavior: z.string().min(1),
  compositionBehavior: z.string().min(1),
  subjectBehavior: z.string().min(1),
  realismBehavior: z.string().min(1),
  typographyBehavior: z
    .string()
    .min(1)
    .describe("Rules about text inside generated assets (usually avoid)."),
  prohibitedPatterns: stringList.describe(
    "Shared prohibited AI-visual defaults without product justification.",
  ),
});

export const AssetRelationshipSchema = z.object({
  assetIds: z
    .array(z.string().min(1))
    .min(1)
    .describe("IDs of related planned assets."),
  relationship: z
    .string()
    .min(1)
    .describe("How these assets should relate across the experience."),
});

export const RejectedAssetIdeaSchema = z.object({
  idea: z.string().min(1),
  reason: z
    .string()
    .min(1)
    .describe("Why this idea would hurt or fail to help the product."),
});

export const VisualAssetPlanSchema = z.object({
  id: z.string().min(1),
  creativeDirectionId: z.string().min(1),
  designGenomeId: z.string().min(1),
  strategy: AssetPlanStrategySchema,
  assets: z
    .array(PlannedVisualAssetSchema)
    .default([])
    .describe(
      "Planned assets. May be empty if typography/layout/native UI serve better.",
    ),
  globalGenerationRules: GlobalGenerationRulesSchema,
  assetRelationships: z
    .array(AssetRelationshipSchema)
    .default([])
    .describe("How assets relate so they do not feel like unrelated AI images."),
  rejectedIdeas: z
    .array(RejectedAssetIdeaSchema)
    .default([])
    .describe("Ideas deliberately rejected to demonstrate restraint."),
  noAssetsRationale: z
    .string()
    .default("")
    .describe(
      "If assets is empty, explain why no generated imagery is required. Otherwise empty.",
    ),
});

export type VisualAssetType = z.infer<typeof VisualAssetTypeSchema>;
export type VisualAssetStatus = z.infer<typeof VisualAssetStatusSchema>;
export type VisualAssetPriority = z.infer<typeof VisualAssetPrioritySchema>;
export type AssetVariant = z.infer<typeof AssetVariantSchema>;
export type GenerationBrief = z.infer<typeof GenerationBriefSchema>;
export type AssetAccessibility = z.infer<typeof AssetAccessibilitySchema>;
export type PlannedVisualAsset = z.infer<typeof PlannedVisualAssetSchema>;
export type AssetPlanStrategy = z.infer<typeof AssetPlanStrategySchema>;
export type GlobalGenerationRules = z.infer<typeof GlobalGenerationRulesSchema>;
export type AssetRelationship = z.infer<typeof AssetRelationshipSchema>;
export type RejectedAssetIdea = z.infer<typeof RejectedAssetIdeaSchema>;
export type VisualAssetPlan = z.infer<typeof VisualAssetPlanSchema>;
