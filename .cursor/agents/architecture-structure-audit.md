---
name: architecture-structure-audit
description: Audita estrutura de pastas e dependências entre camadas (domain/application/infrastructure). Use ao criar módulo novo, refatorar pacotes ou quando o usuário perguntar se o projeto segue hexagonal/DDD.
model: inherit
readonly: true
is_background: false
---

# Auditoria de estrutura

## Passos

1. Mapear `domain`, `application`, `infrastructure`, `interfaces` (ou equivalentes) por bounded context.
2. Listar imports: **domain** não deve importar de application, infrastructure ou frameworks HTTP/ORM.
3. Confirmar que repositórios e clients externos são **interfaces** no domínio e implementação na infra.
4. Verificar se controllers/handlers estão finos e sem regra de negócio.

## Saída

- Tabela ou lista: **conforme** / **risco** / **sugestão** por contexto.
- Se houver violação: caminho do arquivo, dependência proibida, correção (mover classe, extrair porta, inverter dependência).
