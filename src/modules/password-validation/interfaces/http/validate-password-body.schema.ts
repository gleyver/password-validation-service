import { z } from "zod";

/**
 * Schema Zod da entrada HTTP após `JSON.parse`.
 * @remarks `includeAssistantHints` só vira `true` com o literal JSON `true`; qualquer outro valor vira `false`.
 */
export const validatePasswordRequestBodySchema = z
  .object({
    password: z.string().min(1),
    includeAssistantHints: z.unknown().optional(),
  })
  .transform((body) => ({
    password: body.password,
    includeAssistantHints: body.includeAssistantHints === true,
  }));

export type ValidatePasswordRequestBody = z.infer<
  typeof validatePasswordRequestBodySchema
>;
