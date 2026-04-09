import { createValidatePasswordUseCase } from "./composition-root.js";
import { createHttpApp } from "./platform/http/http-server.js";
import { createLogger, type Logger } from "./platform/logging/logger.js";
import { createValidatePasswordHandler } from "./modules/password-validation/interfaces/http/validate-password.http.js";

export function buildApplication(options?: { logger?: Logger }) {
  const logger =
    options?.logger ?? createLogger({ service: "password-validation-service" });
  const useCase = createValidatePasswordUseCase();
  const validateHandler = createValidatePasswordHandler(useCase);
  const app = createHttpApp({
    logger,
    routes: [
      {
        method: "GET",
        path: "/health",
        handler: (_req, res) => {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.end(JSON.stringify({ status: "ok" }));
        },
      },
      {
        method: "POST",
        path: "/v1/password-validations",
        handler: validateHandler,
      },
    ],
  });
  return { app, logger };
}
