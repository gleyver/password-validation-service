import { createValidatePasswordUseCase } from "./composition-root.js";
import { createHttpApp } from "./platform/http/http-server.js";
import {
  HTTP_JSON_STATIC,
  writeJsonUtf8,
} from "./platform/http/write-json-response.js";
import { createLogger, type Logger } from "./platform/logging/logger.js";
import { createValidatePasswordHandler } from "./modules/password-validation/interfaces/http/validate-password.http.js";

/**
 * Monta logger, rotas e aplicação HTTP (pronta para `listen` / testes).
 * @param options.logger - Se omitido, usa `service: password-validation-service`.
 * @returns Aplicação HTTP e logger usado.
 */
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
          writeJsonUtf8(res, 200, HTTP_JSON_STATIC.healthOk);
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
