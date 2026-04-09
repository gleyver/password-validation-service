import type { IncomingMessage, ServerResponse } from "node:http";
import type { Logger } from "../../../../platform/logging/logger.js";
import { readJsonBody } from "../../../../platform/http/json-body.js";
import { writeJsonResponse } from "../../../../platform/http/write-json-response.js";
import type { ValidatePasswordUseCase } from "../../application/validate-password.use-case.js";
import type { ValidatePasswordSuccessJsonBody } from "./validate-password-http.dto.js";
import { validatePasswordRequestBodySchema } from "./validate-password-body.schema.js";

type BodyShape = Record<string, unknown>;

/**
 * Handler para `POST /v1/password-validations` (JSON, validação na borda, caso de uso).
 * @param useCase - Caso de uso já composto.
 * @returns Handler assíncrono no formato esperado por `createHttpApp` (`RouteHandler`).
 */
export function createValidatePasswordHandler(useCase: ValidatePasswordUseCase) {
  return async (
    req: IncomingMessage,
    res: ServerResponse,
    ctx: { requestId: string; logger: Logger },
  ): Promise<void> => {
    const parsed = await readJsonBody<BodyShape>(req);
    if (!parsed.ok) {
      ctx.logger.log("warn", "validate_password_body_rejected", {
        reason: parsed.error,
      });
      const statusCode = parsed.error === "payload_too_large" ? 413 : 400;
      writeJsonResponse(res, statusCode, { error: parsed.error });
      return;
    }
    const body = validatePasswordRequestBodySchema.safeParse(parsed.value);
    if (!body.success) {
      ctx.logger.log("warn", "validate_password_invalid_password_field");
      writeJsonResponse(res, 400, { error: "invalid_password_field" });
      return;
    }
    const { password, includeAssistantHints } = body.data;
    const passwordLength = password.length;
    ctx.logger.log("info", "validate_password_request", {
      passwordLength,
      includeAssistantHints,
    });
    const output = await useCase.execute({
      password,
      includeAssistantHints,
    });
    ctx.logger.log("info", "validate_password_response", {
      valid: output.valid,
      hintsCount: output.assistantHints?.length ?? 0,
    });
    const payload: ValidatePasswordSuccessJsonBody = output.assistantHints
      ? { valid: output.valid, assistantHints: output.assistantHints }
      : { valid: output.valid };
    writeJsonResponse(res, 200, payload);
  };
}
