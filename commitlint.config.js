/** @type {import('@commitlint/types').UserConfig} */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      2,
      'always',
      [
        'frontend',
        'backend',
        'api-sdk',
        'ui',
        'types',
        'validators',
        'config',
        'database',
        'tooling',
        'deps',
        'ci',
        'docs',
        'repo',
      ],
    ],
  },
};
