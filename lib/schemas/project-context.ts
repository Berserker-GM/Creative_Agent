import { z } from "zod";

export const ReferenceTypeSchema = z.enum(["image", "video", "website"]);

export const ReferenceSchema = z.object({
  id: z.string().min(1),
  type: ReferenceTypeSchema,
  /** Website URL, or a local file marker such as `local:filename.ext`. */
  source: z.string().min(1),
  title: z.string().optional(),
  notes: z.string().optional(),
});

export type Reference = z.infer<typeof ReferenceSchema>;

export const ConstraintsSchema = z.object({
  framework: z.string().optional(),
  mustKeep: z.array(z.string()).default([]),
  mustAvoid: z.array(z.string()).default([]),
  performance: z.array(z.string()).default([]),
});

export type Constraints = z.infer<typeof ConstraintsSchema>;

export const ExistingProductSchema = z.object({
  type: z.enum(["url", "repository"]),
  source: z.string().min(1),
});

export type ExistingProduct = z.infer<typeof ExistingProductSchema>;

/**
 * Product / project understanding contract.
 * Intentionally excludes DesignGenome fields (typography, palette, motion, etc.).
 */
export const ProjectContextSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, "Project name is required"),
  /** Primary description of what is being built. */
  product: z.string().min(1, "Describe what you are building"),
  problem: z.string().optional(),
  solution: z.string().optional(),
  targetUsers: z.string().optional(),
  goals: z.array(z.string()).default([]),
  personality: z.string().optional(),
  emotions: z.array(z.string()).default([]),
  features: z.array(z.string()).default([]),
  visualPreferences: z.string().optional(),
  visualAvoidances: z.string().optional(),
  references: z.array(ReferenceSchema).default([]),
  constraints: ConstraintsSchema.default({
    mustKeep: [],
    mustAvoid: [],
    performance: [],
  }),
  existingProduct: ExistingProductSchema.nullable().optional(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export type ProjectContext = z.infer<typeof ProjectContextSchema>;
