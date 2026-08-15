import { z } from "zod";

/**
 * Session-only generated motion result for M09.
 * Not persisted. Provider-normalized only.
 */
export const GeneratedMotionSchema = z.object({
  id: z.string().min(1),
  motionPlanId: z.string().min(1),
  assetId: z.string().min(1),
  provider: z.string().min(1),
  model: z.string().min(1),
  status: z.enum(["ready", "skipped", "unavailable", "failed"]),
  /** Optional base64 video payload when a provider returns one. */
  data: z.string().default(""),
  mimeType: z.string().default(""),
  /** Optional temporary playback URL if a provider returns one (may expire). */
  playbackUrl: z.string().default(""),
  message: z
    .string()
    .default("")
    .describe("Human-readable status detail for the UI."),
  createdAt: z.string().min(1),
});

export type GeneratedMotion = z.infer<typeof GeneratedMotionSchema>;
