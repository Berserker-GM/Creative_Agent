import { z } from "zod";

/**
 * Convert a Zod schema to a JSON Schema object suitable for Gemini
 * `responseJsonSchema` (strip meta fields Gemini does not need).
 */
export function zodToGeminiJsonSchema(
  schema: z.ZodType,
): Record<string, unknown> {
  const jsonSchema = z.toJSONSchema(schema) as Record<string, unknown>;
  // Gemini only needs the schema body; drop JSON Schema meta.
  delete jsonSchema.$schema;
  return jsonSchema;
}
