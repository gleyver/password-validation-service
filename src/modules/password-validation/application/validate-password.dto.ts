export type ValidatePasswordInput = {
  readonly password: string;
  readonly includeAssistantHints: boolean;
};

export type ValidatePasswordOutput = {
  readonly valid: boolean;
  readonly assistantHints?: readonly string[];
};
