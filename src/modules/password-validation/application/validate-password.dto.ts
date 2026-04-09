/** Entrada do caso de uso (normalmente já validada no handler HTTP). */
export type ValidatePasswordInput = {
  readonly password: string;
  readonly includeAssistantHints: boolean;
};

/** Saída: validade e, opcionalmente, dicas do assistente. */
export type ValidatePasswordOutput = {
  readonly valid: boolean;
  readonly assistantHints?: readonly string[];
};
