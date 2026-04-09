/**
 * Saída legível no terminal ao subir o processo (complementa o log JSON estruturado).
 */
export function printServerReady(port: number, host: string): void {
  const localUrl = `http://localhost:${port}`;
  const bind = `${host}:${port}`;
  const inner = 56;
  const row = (text: string) => `  │ ${text.padEnd(inner)} │\n`;
  process.stdout.write(
    "\n" +
      `  ╭${"─".repeat(inner + 2)}╮\n` +
      row("") +
      row("password-validation-service") +
      row("") +
      row(`Local  ${localUrl}`) +
      row(`Bind   ${bind}`) +
      row("") +
      `  ╰${"─".repeat(inner + 2)}╯\n\n`,
  );
}
