import { z } from "zod";

/**
 * Conceptual motion plan derived from Creative Agent outputs.
 * Not CSS, not React, not provider-specific parameters.
 */
const stringList = z.array(z.string().min(1)).min(1);

export const MotionPlanSchema = z.object({
  id: z.string().min(1),
  assetId: z.string().min(1),
  creativeDirectionId: z.string().min(1),
  designGenomeId: z.string().min(1),
  concept: z
    .string()
    .min(1)
    .describe("Central motion concept derived from the creative system."),
  purpose: z
    .string()
    .min(1)
    .describe("Why motion exists for this asset/product experience."),
  motionLanguage: z
    .string()
    .min(1)
    .describe("Overall motion character/language from DesignGenome + direction."),
  subjectMotion: z
    .string()
    .min(1)
    .describe("What in the subject moves, if anything."),
  cameraMotion: z
    .string()
    .min(1)
    .describe("How viewpoint/camera behaves — restrained and purposeful."),
  environmentMotion: z
    .string()
    .min(1)
    .describe("How environment/atmosphere may evolve."),
  transitionBehavior: z
    .string()
    .min(1)
    .describe("How reveals/transitions communicate meaning."),
  timing: z
    .string()
    .min(1)
    .describe("Pacing and duration character — not keyframe recipes."),
  intensity: z
    .string()
    .min(1)
    .describe("How strong/subtle the motion should feel."),
  loopBehavior: z
    .string()
    .min(1)
    .describe("Whether/how motion should loop for this asset role."),
  interactionRole: z
    .string()
    .min(1)
    .describe("How motion relates to user interaction or remains atmospheric."),
  negativeConstraints: stringList.describe(
    "Explicit motion anti-patterns derived from genome/direction/asset.",
  ),
  generationBrief: z
    .string()
    .min(1)
    .describe(
      "Provider-agnostic brief for a future motion/video model. Not CSS.",
    ),
  requiresGeneration: z
    .boolean()
    .describe(
      "False when this asset is better served without generated video.",
    ),
  skipReason: z
    .string()
    .default("")
    .describe(
      "If requiresGeneration is false, explain why video should not be generated.",
    ),
});

export type MotionPlan = z.infer<typeof MotionPlanSchema>;
