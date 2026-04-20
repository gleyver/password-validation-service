import type { IncomingMessage, ServerResponse } from "node:http";
import type { Logger } from "../../../../platform/logging/logger.js";
import { readJsonBody } from "../../../../platform/http/json-body.js";
import {
  HTTP_JSON_STATIC,
  writeJsonResponse,
  writeJsonUtf8,
} from "../../../../platform/http/write-json-response.js";
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
      if (parsed.error === "payload_too_large") {
        writeJsonUtf8(res, 413, HTTP_JSON_STATIC.errorPayloadTooLarge);
      } else if (parsed.error === "empty_body") {
        writeJsonUtf8(res, 400, HTTP_JSON_STATIC.errorEmptyBody);
      } else {
        writeJsonUtf8(res, 400, HTTP_JSON_STATIC.errorInvalidJson);
      }
      return;
    }
    const body = validatePasswordRequestBodySchema.safeParse(parsed.value);
    if (!body.success) {
      ctx.logger.log("warn", "validate_password_invalid_password_field");
      writeJsonUtf8(res, 400, HTTP_JSON_STATIC.errorInvalidPasswordField);
      return;
    }
    const { password, includeAssistantHints } = body.data;
    const passwordLength = password.length;
    const payload: ValidatePasswordSuccessJsonBody = await useCase.execute({
      password,
      includeAssistantHints,
    });

    ctx.logger.log("info", "validate_password", {
      passwordLength,
      includeAssistantHints,
      valid: payload.valid,
      hintsCount: payload.assistantHints?.length ?? 0,
    });

    writeJsonResponse(res, 200, payload);
  };
}
