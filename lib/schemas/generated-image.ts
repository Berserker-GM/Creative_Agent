import { z } from "zod";

/**
 * Session-only generated image result for M08.
 * Not persisted to database, filesystem, or git.
 */
export const GeneratedImageSchema = z.object({
  id: z.string().min(1),
  assetId: z.string().min(1),
  provider: z.string().min(1),
  model: z.string().min(1),
  prompt: z.string().min(1),
  status: z.enum(["ready", "failed"]),
  mimeType: z.string().min(1),
  /** Raw base64 payload (no data-URL prefix). */
  data: z.string().min(1),
  createdAt: z.string().min(1),
});

export type GeneratedImage = z.infer<typeof GeneratedImageSchema>;
