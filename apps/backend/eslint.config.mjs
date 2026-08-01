import baseConfig from '@gmrlog/eslint-config/base';

/**
 * The `testing/**` override that used to live here moved into the shared base
 * config (D3.28). Keeping it package-local meant `pnpm lint` and the root-level
 * `lint-staged` hook disagreed about the same file: one loaded this config, the
 * other did not.
 *
 * @type {import('eslint').Linter.Config[]}
 */
export default [...baseConfig];
