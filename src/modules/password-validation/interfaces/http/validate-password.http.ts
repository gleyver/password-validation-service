import type { IncomingMessage, ServerResponse } from "node:http";
import type { Logger } from "../../../../platform/logging/logger.js";
import { readJsonBody } from "../../../../platform/http/json-body.js";
import type { ValidatePasswordUseCase } from "../../application/validate-password.use-case.js";
import { validatePasswordRequestBodySchema } from "./validate-password-body.schema.js";

type BodyShape = Record<string, unknown>;

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
      res.statusCode = parsed.error === "payload_too_large" ? 413 : 400;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ error: parsed.error }));
      return;
    }
    const body = validatePasswordRequestBodySchema.safeParse(parsed.value);
    if (!body.success) {
      ctx.logger.log("warn", "validate_password_invalid_password_field");
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ error: "invalid_password_field" }));
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
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    const payload: Record<string, unknown> = { valid: output.valid };
    if (output.assistantHints) {
      payload.assistantHints = output.assistantHints;
    }
    res.end(JSON.stringify(payload));
  };
}
