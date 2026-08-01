import eslint from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/** @type {import('eslint').Linter.Config[]} */
const baseConfig = tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/.turbo/**',
      '**/.expo/**',
      '**/eslint.config.mjs',
      '**/eslint.config.js',
      '**/*.spec.ts',
      '**/*.spec.tsx',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  eslintConfigPrettier,
  {
    plugins: {
      import: importPlugin,
    },
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
    rules: {
      // NestJS modules are intentionally member-less classes.
      '@typescript-eslint/no-extraneous-class': 'off',
      'import/order': [
        'error',
        {
          alphabetize: { order: 'asc', caseInsensitive: true },
          'newlines-between': 'always',
        },
      ],
    },
  },
  {
    /**
     * In-memory test doubles.
     *
     * A fake implements a port whose real driver hits Postgres, so its methods
     * are `async` to satisfy the interface while their bodies touch nothing but
     * a Map. That makes `require-await` fire on every method, and exhaustive
     * fixture types make defensive guards look statically impossible. All three
     * complaints are artefacts of the double being a double.
     *
     * This lived in `apps/backend/eslint.config.mjs` and so applied only when
     * eslint ran from that package. `lint-staged` runs from the repo root
     * against the root config, which had no such override — the same file
     * passed `pnpm lint` and failed the commit hook. The convention belongs to
     * the monorepo, so it is declared once, here.
     */
    files: ['**/testing/**/*.ts', '**/test-support/**/*.ts'],
    rules: {
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/no-unnecessary-type-conversion': 'off',
    },
  },
  {
    /**
     * Plain-JS tooling that lives outside every `tsconfig` — release smoke
     * scripts, database helpers, and this config's own package.
     *
     * `projectService: true` asks the TypeScript program for type information,
     * and a file no tsconfig includes cannot supply it: the parse fails outright
     * with "not found by the project service" rather than reporting a lint
     * problem. The per-package `lint` scripts never noticed because each scopes
     * itself to `src`/`app`; only a root-level run over every file — which is
     * exactly what the `lint-staged` pre-commit hook does — reaches them.
     *
     * Disabling the type-aware rules here keeps these files linted for syntax
     * and correctness instead of unparseable. Making them lintable-at-all beats
     * adding them to `ignores`, which would hide real problems.
     */
    files: [
      // Leading `**/` matters: workspace packages carry their own `scripts/`
      // directories (`packages/database/scripts/**`), and a root-anchored glob
      // silently misses them.
      '**/scripts/**/*.{js,mjs,cjs}',
      '**/tooling/**/*.{js,mjs,cjs}',
      '**/*.config.{js,mjs,cjs}',
    ],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: {
      // These run under Node, not in a bundler — `process`, `console`, and
      // `fetch` are ambient here and are not undefined variables.
      globals: globals.node,
      parserOptions: {
        projectService: false,
      },
    },
    rules: {
      /**
       * CommonJS is the native module system for this tier. Metro and Babel
       * both load their config through `require`, so forbidding it here would
       * be asking these files to be something they are not — the rule guards
       * application code, where ESM is the standard.
       */
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
);

export default baseConfig;
