import type { IncomingMessage, ServerResponse } from "node:http";
import type { Logger } from "../../../../platform/logging/logger.js";
import { readJsonBody } from "../../../../platform/http/json-body.js";
import type { ValidatePasswordUseCase } from "../../application/validate-password.use-case.js";

type BodyShape = {
  password?: unknown;
  includeAssistantHints?: unknown;
};

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.length > 0;
}

function parseIncludeHints(v: unknown): boolean {
  return v === true;
}

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
    const body = parsed.value;
    if (!isNonEmptyString(body.password)) {
      ctx.logger.log("warn", "validate_password_invalid_password_field");
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ error: "invalid_password_field" }));
      return;
    }
    const includeAssistantHints = parseIncludeHints(body.includeAssistantHints);
    const passwordLength = body.password.length;
    ctx.logger.log("info", "validate_password_request", {
      passwordLength,
      includeAssistantHints,
    });
    const output = await useCase.execute({
      password: body.password,
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
