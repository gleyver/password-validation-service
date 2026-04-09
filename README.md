# Serviço de validação de senha

API HTTP em **Node.js** + **TypeScript** que expõe um endpoint para validar senhas segundo regras fixas (desafio técnico). O código prioriza **arquitetura hexagonal**, **DDD**, **testes** (unitários, integração HTTP) e **observabilidade** com logs estruturados.

---

## Referência rápida

| Item | Valor |
|------|--------|
| **POST** validação | `/v1/password-validations` |
| **GET** health | `/health` → `{ "status": "ok" }` |
| **Dev** | `npm install` → `npm run dev` |
| **Produção** | `npm run build` → `npm start` |
| **Testes** | `npm test` · `npm run test:coverage` |
| **Node** | ≥ 20 (`engines` no `package.json`) |

---

## Índice

1. [Visão geral](#1-visão-geral)
2. [Arquitetura](#2-arquitetura)
3. [Princípios e boas práticas](#3-princípios-e-boas-práticas)
4. [Estrutura do repositório e papel de cada arquivo](#4-estrutura-do-repositório-e-papel-de-cada-arquivo)
5. [Fluxo de uma requisição](#5-fluxo-de-uma-requisição)
6. [API HTTP](#6-api-http)
7. [Regras de negócio](#7-regras-de-negócio)
8. [Pré-requisitos, instalação e execução](#8-pré-requisitos-instalação-e-execução)
9. [Testes](#9-testes)
10. [Configuração TypeScript e build](#10-configuração-typescript-e-build)
11. [Uso de IA](#11-uso-de-ia)
12. [Licença](#12-licença)

---

## 1. Visão geral

| Aspecto | Decisão |
|---------|---------|
| **Transporte** | `node:http` nativo |
| **Validação de entrada** | Na borda HTTP (Zod + limite de corpo) + política no domínio |
| **Persistência** | Não há banco de dados |
| **Estado** | Stateless (várias réplicas atrás de load balancer) |
| **Logs** | JSON em `stdout`/`stderr`, com `requestId` |
| **Dependências de runtime** | **`zod`** (validação do body na borda) |
| **DevDependencies** | `typescript`, `tsx`, `@types/node` |

Em produção compilada, o processo roda **Node** e o JavaScript gerado em `dist/`.

---

## 2. Arquitetura

### 2.1 Hexagonal (ports and adapters)

- **Núcleo (domínio + aplicação):** não conhece HTTP, nem formato JSON de framework.
- **Portas:** interfaces que o domínio/caso de uso precisa (ex.: `PasswordAssistantPort` para mensagens assistivas).
- **Adaptadores:** implementações concretas (handler HTTP, `DeterministicPasswordAssistant`).

Isso permite trocar o transporte (CLI, fila, outro servidor) ou a origem das dicas sem reescrever as regras de senha.

### 2.2 DDD (Domain-Driven Design) enxuto

- **Bounded context:** `password-validation` (módulo sob `src/modules/`).
- **Domain:** política e validador puros; porta `PasswordAssistantPort`.
- **Application:** `ValidatePasswordUseCase` orquestra domínio + porta.
- **Infrastructure:** assistente determinístico.
- **Interfaces:** handler HTTP (`validate-password.http.ts`).

### 2.3 Camadas e dependências

```
interfaces (HTTP)  →  application  →  domain
                         ↓
                   infrastructure (implementa portas)
```

Regra: **`domain` não importa** `application`, `infrastructure` nem `interfaces`.

### 2.4 Composição (fora do módulo)

- **`composition-root.ts`:** “raiz de composição” — instancia implementações e o caso de uso (wiring).
- **`app.ts`:** monta rotas + `createHttpApp`.
- **`server.ts`:** ponto de entrada do processo (`listenAvailable`), banner human-readable no terminal e **encerramento gracioso** em `SIGINT`, `SIGTERM` e `SIGHUP`.

---

## 3. Princípios e boas práticas

### 3.1 SOLID (aplicação prática)

- **S:** `validatePasswordPolicy` concentra a política; handler só mapeia HTTP → caso de uso.
- **O:** novas regras ou novos assistentes estendem via funções/portas sem quebrar contratos existentes.
- **L:** portas com implementações substituíveis (`DeterministicPasswordAssistant`).
- **I:** `PasswordAssistantPort` pequena (`enrichWithHints`).
- **D:** caso de uso depende da abstração `PasswordAssistantPort`, não de detalhe HTTP.

### 3.2 REST

- Recurso substantivo: `POST /v1/password-validations`.
- Respostas com status explícitos (200, 400, 413, 404, 500 quando não tratado no handler).

### 3.3 Segurança na borda

- Limite de tamanho do corpo JSON (mitigação a payloads grandes; padrão **16 KiB** em `readJsonBody`).
- Senha **não** é escrita em logs (apenas `passwordLength`).
- Validação de tipo/shape mínimo do body antes do caso de uso.

### 3.4 Observabilidade

- Logs **estruturados** (uma linha JSON por evento).
- **`X-Request-Id`** para correlação entre cliente e logs.
- Banner ASCII em `stdout` ao subir (`printServerReady`) complementa os logs JSON para quem olha o terminal.

### 3.5 Código

- TypeScript **strict**.
- Funções puras no validador de domínio (fácil de testar).
- **Early return** no handler HTTP para erros de body/campo.

### 3.6 Melhorias futuras (segurança e acesso)

Pontos a considerar em evoluções do serviço (não implementados no escopo atual do desafio):

- **Autenticação na API:** exigir `Authorization: Bearer <token>` (ou API key, OAuth2 *client credentials*) nos endpoints sensíveis, de modo que apenas clientes autorizados chamem a validação. Faz sentido quando a API não for pública ou quando houver cota/rastreio por cliente.
- **Confidencialidade da senha em trânsito:** em produção, **HTTPS (TLS)** é o pilar para não expor a senha na rede; evitar tráfego HTTP sem TLS. **Criptografia adicional** no corpo (ex.: *envelope* com chave acordada, JWE) ou **mTLS** podem ser avaliados como *defense in depth* quando a política de segurança exigir. Vale notar que a validação de regras (comprimento, tipos de caractere) pressupõe que o servidor consiga interpretar o conteúdo conforme o contrato; qualquer esquema de cifragem de campo precisa ser definido em conjunto com esse contrato (incluindo onde ocorre a decriptação e como isso afeta logs e retenção).
- **Rate limit**s

---

## 4. Estrutura do repositório e papel de cada arquivo

### Raiz do projeto

| Arquivo / pasta | Função |
|-----------------|--------|
| `package.json` | Scripts (`dev`, `build`, `start`, `test`, `test:coverage`), `engines`, dependências (`zod`) e devDependencies. |
| `package-lock.json` | Lock de versões npm. |
| `tsconfig.json` | Alvo ES2022, `NodeNext`, `outDir: dist`, `strict`, `declaration`/`sourceMap`, `"types": ["node"]`. |
| `.env.example` | Notas sobre execução (sem variáveis obrigatórias; o Node não carrega `.env` sozinho). |
| `.gitignore` | Ignora `node_modules`, `dist`, etc. |
| `README.md` | Esta documentação. |

### `src/` — aplicação

| Arquivo | Função |
|---------|--------|
| **`server.ts`** | Chama `buildApplication()`, escuta em **`0.0.0.0`** com **`listenAvailable`** a partir da porta **3000**; tenta portas consecutivas até **10.000** tentativas (ex.: `EADDRINUSE`); loga `server_listening` com a porta efetiva; imprime banner via `printServerReady`; registro de sinais para shutdown ordenado. |
| **`app.ts`** | Cria `logger`, `ValidatePasswordUseCase`, handler de validação, registra rotas em `createHttpApp`. Exporta `buildApplication()` para testes. |
| **`composition-root.ts`** | `createValidatePasswordUseCase()` — injeta `DeterministicPasswordAssistant`. |

### `src/platform/` — infraestrutura transversal (não é regra de negócio)

| Arquivo | Função |
|---------|--------|
| **`platform/logging/logger.dto.ts`** | DTOs / contratos: `LogLevel`, `LogFields`, `Logger`. |
| **`platform/logging/logger.ts`** | `createLogger`, `newRequestId`, logs JSON; nível `error` vai para `stderr`; reexporta os DTOs. |
| **`platform/logging/print-server-ready.ts`** | Banner no terminal com URL local e bind (complementa os logs JSON ao iniciar). |
| **`platform/http/http-server.dto.ts`** | DTOs `RouteHandler`, `HttpServerApp`. |
| **`platform/http/http-server.ts`** | `createHttpApp`: servidor `node:http`, roteamento por método+path, `X-Request-Id`, 404, try/catch → 500; `listen` / `listenAvailable` (com limite de tentativas); reexporta os DTOs. |
| **`platform/http/write-json-response.ts`** | `writeJsonResponse`: status, `Content-Type` JSON UTF-8, `JSON.stringify` do corpo. |
| **`platform/http/json-body.dto.ts`** | DTO `JsonBodyResult<T>`. |
| **`platform/http/json-body.ts`** | `readJsonBody`: lê stream com limite de bytes (padrão 16 KiB); reexporta `JsonBodyResult`. |

### `src/modules/password-validation/domain/`

| Arquivo | Função |
|---------|--------|
| **`password-validator.dto.ts`** | DTOs `PasswordValidationSuccess`, `PasswordValidationFailure`, `PasswordValidationResult`. |
| **`password-validator.ts`** | Constantes `MIN_LENGTH`, `ALLOWED_SPECIALS`; `validatePasswordPolicy` — regras do desafio; coleta **todos** os motivos de falha em ordem fixa; reexporta os DTOs. |
| **`password-failure-reason.ts`** | Enum `PasswordFailureReason` (códigos de falha). |
| **`ports/password-assistant.port.ts`** | Interface `PasswordAssistantPort` — porta de saída para dicas assistivas. |

### `src/modules/password-validation/application/`

| Arquivo | Função |
|---------|--------|
| **`validate-password.dto.ts`** | DTOs `ValidatePasswordInput`, `ValidatePasswordOutput`. |
| **`validate-password.use-case.ts`** | `ValidatePasswordUseCase.execute`: valida via domínio; opcionalmente preenche `assistantHints` pela porta. |

### `src/modules/password-validation/infrastructure/`

| Arquivo | Função |
|---------|--------|
| **`deterministic-password-assistant.ts`** | Implementa `PasswordAssistantPort`: mapeia códigos de `reasons` para texto em português. |

### `src/modules/password-validation/interfaces/http/`

| Arquivo | Função |
|---------|--------|
| **`validate-password.http.ts`** | Factory `createValidatePasswordHandler`: lê body, valida com Zod (`validate-password-body.schema.ts`), chama use case, devolve JSON e status. |
| **`validate-password-body.schema.ts`** | Schema Zod do body: `password` string não vazia; `includeAssistantHints` opcional (só vira `true` com literal JSON `true`). |
| **`validate-password-http.dto.ts`** | Tipo `ValidatePasswordSuccessJsonBody` para o JSON de sucesso (200). |

### `src/**/*.test.ts` — testes

| Arquivo | Tipo | Função |
|---------|------|--------|
| **`http.integration.test.ts`** | **Integração** | Sobe `buildApplication()` em porta livre; testa fluxos reais HTTP. |
| **`app.test.ts`** | Unitário | `buildApplication` com logger padrão vs injetado. |
| **`platform/http/json-body.test.ts`** | Unitário | Cenários de `readJsonBody`. |
| **`platform/http/write-json-response.test.ts`** | Unitário | `writeJsonResponse` (status, headers, corpo). |
| **`platform/http/http-server.test.ts`** | Unitário | 404, 500, query string no path. |
| **`platform/logging/logger.test.ts`** | Unitário | Saída stdout/stderr e `newRequestId`. |
| **`domain/password-validator.test.ts`** | Unitário | Constantes exportadas e regras de `validatePasswordPolicy`. |
| **`application/validate-password.use-case.test.ts`** | Unitário | Use case com assistente fake. |
| **`infrastructure/deterministic-password-assistant.test.ts`** | Unitário | Mapeamento de dicas. |
| **`interfaces/http/validate-password-body.schema.test.ts`** | Unitário | Contrato Zod do body (incl. `includeAssistantHints`). |

### `dist/` (gerado)

Saída do `tsc` — não versionar em repositórios enxutos; gerada com `npm run build`.

---

## 5. Fluxo de uma requisição

1. Cliente envia `POST /v1/password-validations` com JSON.
2. `http-server` gera ou repassa `requestId`, cria logger filho.
3. Roteador chama `createValidatePasswordHandler`.
4. `readJsonBody` lê o corpo com limite de tamanho.
5. Handler valida o body com **Zod** (`validatePasswordRequestBodySchema`): `password` obrigatório e não vazio; **`includeAssistantHints` só ativa dicas quando o JSON envia explicitamente o literal booleano `true`** (ver seção 6).
6. `ValidatePasswordUseCase` chama `validatePasswordPolicy`; se pedido, chama `PasswordAssistantPort`.
7. Resposta `200` com `{ valid, assistantHints? }` ou erro 4xx conforme tabela da API.

---

## 6. API HTTP

### `POST /v1/password-validations`

**Body:**

```json
{
  "password": "string obrigatória não vazia",
  "includeAssistantHints": false
}
```

**Campo `includeAssistantHints` (opcional)**

- **Omissão** do campo, **`false`**, **`null`**, strings, números ou qualquer valor que não seja o literal JSON **`true`** (boolean) são tratados como *desligado*: a API **não** inclui `assistantHints` na resposta (comportamento idêntico a “não pedir dicas”).
- Somente **`"includeAssistantHints": true`** no JSON (tipo boolean, não string) habilita o assistente: a resposta pode trazer `assistantHints` (lista de mensagens em português).
- Isso evita ambiguidade com clientes que enviam `"true"` em aspas ou `1` esperando o mesmo efeito: nesses casos as dicas **não** são ativadas.

**Sucesso (200):** `{ "valid": boolean }` e, se as dicas foram solicitadas conforme acima, `assistantHints: string[]`.

**Erros HTTP (exemplos):**

| Status | Código em `error` | Quando |
|--------|-------------------|--------|
| 400 | `invalid_json`, `empty_body`, `invalid_password_field` | Body inválido, vazio ou campo `password` inaceitável |
| 413 | `payload_too_large` | Corpo acima do limite em `readJsonBody` |
| 404 | `not_found` | Método/path não registrado |
| 500 | `internal_error` | Exceção não tratada no handler (após `try/catch` do `createHttpApp`) |

### `GET /health`

**200:** `{ "status": "ok" }` — probe de vida.

### Cabeçalhos

- Envio opcional: `X-Request-Id: <seu-id>` — ecoado na resposta.

### Exemplos `curl`

```bash
# Válida
curl -s -X POST http://localhost:3000/v1/password-validations \
  -H "Content-Type: application/json" \
  -d '{"password":"Ab1!cdefgh"}'

# Inválida com dicas
curl -s -X POST http://localhost:3000/v1/password-validations \
  -H "Content-Type: application/json" \
  -d '{"password":"fraca","includeAssistantHints":true}'

# Health
curl -s http://localhost:3000/health
```

---

## 7. Regras de negócio

Implementadas em `password-validator.ts`:

1. Comprimento ≥ 9 (`MIN_LENGTH`).
2. Pelo menos um dígito `0-9`, uma minúscula `a-z`, uma maiúscula `A-Z`.
3. Pelo menos um especial entre ``!@#$%^&*()-+`` (constante `ALLOWED_SPECIALS`).
4. **Sem caracteres repetidos** (cada posição é única no conjunto de caracteres da string).
5. **Nenhum whitespace** (`\s`) — presença invalida a senha.

Quando a senha é inválida, **vários** motivos podem ser retornados de uma vez (ordem fixa em `collectFailureReasons`), o que alimenta o assistente com múltiplas dicas.

O enunciado do desafio **não** fixa tamanho máximo da senha; não há limite na camada de domínio. Na prática, o corpo JSON da requisição continua limitado na **borda HTTP** (`readJsonBody`, padrão **16 KiB**), o que impõe um teto ao tamanho do campo `password` por requisição.

---

## 8. Pré-requisitos, instalação e execução

### Pré-requisitos

- **Node.js** ≥ 20 (ver `engines` em `package.json`).
- **npm** (vem com o Node).

### Instalação

```bash
cd password-validation-service
npm install
```

### Executar

```bash
# Desenvolvimento (TypeScript via tsx)
npm run dev

# Build + produção
npm run build
npm start
```

### Porta e host

- **Host:** fixo em **`0.0.0.0`** (todas as interfaces; acesse como `http://localhost:<porta>` na sua máquina).
- **Porta:** não é necessário configurar arquivo `.env`. O servidor tenta **`3000`**, e se estiver em uso tenta **`3001`**, **`3002`**, e assim por diante, até **10.000** tentativas consecutivas; se nenhuma estiver livre nesse intervalo, o processo encerra com erro. A porta efetiva aparece no log **`server_listening`** e no banner ao subir.

Os exemplos `curl` neste README usam `3000`; se o processo tiver escolhido outra porta, ajuste a URL ou use a porta indicada no log ou no banner.

---

## 9. Testes

### Tipos de teste no projeto

| Tipo | O que valida |
|------|----------------|
| **Unitário** | Funções isoladas (validador, `readJsonBody`, `writeJsonResponse`, logger, use case com fake, assistente). |
| **Integração HTTP** | App completa + servidor real + cliente `node:http` (sem mock do stack HTTP inteiro). |

### Comandos

```bash
# Toda a suíte (inclui integração)
npm test

# Cobertura experimental (relatório ao final do output)
npm run test:coverage
```

`--test-concurrency=1` está configurado nos scripts para evitar condição de corrida nos testes que interceptam `stdout`/`stderr`.

### Exemplo — teste de domínio (unitário)

Trecho de `password-validator.test.ts`: valida uma regra específica com `node:test` e `assert/strict`:

```typescript
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PasswordFailureReason } from "./password-failure-reason.js";
import { validatePasswordPolicy } from "./password-validator.js";

describe("validatePasswordPolicy", () => {
  it("rejeita caracteres repetidos", () => {
    const r = validatePasswordPolicy("Ab1!cdeffa");
    assert.equal(r.valid, false);
    if (!r.valid) {
      assert.ok(r.reasons.includes(PasswordFailureReason.CaracteresRepetidos));
    }
  });
});
```

### Exemplo — teste de integração HTTP

Ideia de `http.integration.test.ts`: sobe a app em porta aleatória e chama o endpoint real:

```typescript
import assert from "node:assert/strict";
import { describe, it, before, after } from "node:test";
import { buildApplication } from "./app.js";

describe("HTTP integration", () => {
  let port = 0;
  const { app } = buildApplication();

  before(async () => {
    const { port: p } = await app.listen(0, "127.0.0.1");
    port = p;
  });

  after(async () => {
    await app.close();
  });

  it("POST validação retorna valid true para senha que atende as regras", async () => {
    const { status, json } = await postJson(port, "/v1/password-validations", {
      password: "Ab1!cdefgh",
    });
    assert.equal(status, 200);
    assert.deepEqual(json, { valid: true });
  });
});
```

(`postJson` está definido no mesmo arquivo de integração — helper que usa `http.request`.)

### O que a integração cobre (resumo)

- `GET /health` e `/health?query=…`
- `GET` em rota inexistente → 404
- `POST` corpo válido/inválido, vazio, muito grande, JSON quebrado
- `password` ausente, vazio ou tipo errado
- `includeAssistantHints` e respostas com `assistantHints`
- Propagação de `X-Request-Id`

---

## 10. Configuração TypeScript e build

- **`module` / `moduleResolution`:** `NodeNext` — alinhado a ESM e imports com sufixo `.js` nos sources.
- **`rootDir`:** `src` → **`outDir`:** `dist`**.
- **`types": ["node"]`:** necessário para TS 6 resolver `@types/node` corretamente neste setup.
- **`declaration` / `declarationMap` / `sourceMap`:** tipos e mapas para consumo e depuração.

Após `npm run build`, execute com `node dist/server.js` (já configurado em `npm start`).

---

## 11. Uso de IA

Esta seção descreve, de forma transparente, como ferramentas de IA apoiaram o trabalho. A IA foi usada como **assistente** (rascunhos, consistência, exploração de alternativas); **revisão arquitetural, decisões de design e validação final** permanecem humanas.

### Ferramentas

| Ferramenta | Papel |
|------------|--------|
| **Cursor** | Editor com modelo **Composer** (e fluxo de agente) para editar o repositório com contexto do projeto. |
| **ChatGPT** | Conversas pontuais para estruturar ideias, revisões e prompts mais longos. |

### Em que a IA ajudou

- **Testes:** geração e refino de casos unitários e de integração HTTP.
- **Documentação:** estrutura do `README`, descrição do papel dos arquivos e referência rápida.
- **Código:** comentários em **JSDoc** onde fazia sentido e pequenos ajustes **depois** de revisão manual.
- **API:** exemplos de **`curl`** para validar o comportamento dos endpoints.

### Organização dos prompts (contexto → restrições → saída)

Para code review e tarefas parecidas, os prompts seguiram três blocos:

1. **Contexto** — quem é a IA nesta tarefa, cenário e objetivo (“por quê”).
2. **Restrições técnicas** — stack, arquitetura esperada e padrões do repositório (“como”).
3. **Formato de saída** — estrutura da resposta desejada (“o quê entregar”).

No **Cursor**, **rules**, **skills** e **subagentes** (ver links abaixo) ajudam a manter respostas alinhadas às convenções do projeto e a reduzir desvios de escopo em prompts repetidos.

### Referências

- [Cursor — Rules](https://cursor.com/docs/rules)
- [Cursor — Skills](https://cursor.com/docs/skills)
- [Cursor — Subagents](https://cursor.com/docs/subagents)
- [AWS DevOps — “Mastering Amazon Q Developer with Rules”](https://aws.amazon.com/blogs/devops/mastering-amazon-q-developer-with-rules/) (ideia de *rules* em outro ecossistema; útil como leitura complementar)

### Exemplo de prompt para revisão de código

O modelo abaixo foi usado como base para pedir uma análise crítica de trechos do serviço. Substitua o placeholder pelo código real.

```text
Você é um Principal Engineer especialista em Node.js, microserviços, arquitetura hexagonal, DDD, Clean Architecture e sistemas distribuídos.

Contexto:
Estou realizando um code review de um microserviço Node.js. Quero uma análise profunda, técnica e crítica, como seria feita em uma empresa de alto nível de engenharia.

Objetivo:
Identificar problemas arquiteturais, falhas de design, riscos de escalabilidade, problemas de segurança e oportunidades de melhoria.

Código a ser analisado:
[COLE O CÓDIGO AQUI]

Critérios de análise:

1. Arquitetura e design
   - Separação entre domínio, aplicação e infraestrutura
   - Aderência a hexagonal / Clean Architecture
   - Acoplamento indevido entre camadas
   - Uso de DDD (entidades, value objects, agregados)

2. Boas práticas de código
   - SOLID, Object Calisthenics, legibilidade
   - Anti-patterns relevantes ao contexto

3. Testabilidade
   - Testabilidade do desenho atual
   - Sugestões para facilitar testes

4. Performance e escalabilidade
   - I/O, loops, pontos de contenção

5. Segurança
   - Validação de entrada, riscos comuns (ex.: injeção, vazamento de dados)

6. Observabilidade
   - Logs estruturados, métricas, rastreio

7. Padronização
   - Pastas, convenções, consistência

Formato da resposta:

1. Resumo geral (nível percebido: júnior, pleno ou sênior)
2. Principais problemas (por impacto)
3. Sugestões com justificativa técnica
4. Exemplos de refatoração quando necessário
5. Pontos positivos
6. Nota geral de 0 a 10

Critérios de qualidade:
- Direto, técnico e crítico
- Justificar sugestões com boas práticas
- Priorizar o que afeta produção
- Evitar generalidades vazias
```

### Contribuição para qualidade, eficiência e documentação

- **Qualidade:** aceleração na escrita e no refinamento de testes (unitários e integração), sugestões de JSDoc e listas de verificação em revisões assistidas por prompt — sempre filtradas e validadas manualmente. Isso aumenta a cobertura de cenários e a clareza do contrato público das funções sem substituir o critério humano.
- **Eficiência:** menos tempo gasto em texto repetitivo (estrutura do `README`, exemplos `curl`, pequenos ajustes após feedback) e exploração mais rápida de alternativas de implementação ou de teste quando alinhadas às **rules** e **skills** do repositório.
- **Documentação:** o `README` ganhou índice navegável, referência rápida e descrição consistente do papel dos arquivos, o que facilita onboarding e demonstração do desafio para quem avalia o projeto.

---

## 12. Licença

Uso livre para o desafio ou avaliação; ajuste conforme a política da sua organização.
