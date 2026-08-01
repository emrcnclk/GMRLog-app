# Shared monorepo tooling

This directory holds **workspace-level** configuration packages. They are not product libraries.

| Package                     | Role                      |
| --------------------------- | ------------------------- |
| `@gmrlog/typescript-config` | Shared `tsconfig` bases   |
| `@gmrlog/eslint-config`     | Shared ESLint flat config |
| `@gmrlog/prettier-config`   | Shared Prettier config    |

Apps and packages extend these. Do not duplicate ESLint / Prettier / TS bases under `apps/` or `packages/`.
