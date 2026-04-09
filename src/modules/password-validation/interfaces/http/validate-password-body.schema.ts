import { z } from "zod";

/**
 * Schema de entrada na borda HTTP (após JSON parse).
 *
 * Contrato público de `includeAssistantHints`:
 * - Campo opcional.
 * - Apenas o literal JSON booleano `true` liga as dicas do assistente; qualquer outro valor
 *   (incluindo omissão, `false`, `null`, strings, números) vira `false` após o parse.
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
