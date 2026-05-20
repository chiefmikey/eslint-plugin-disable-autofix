// eslint-disable-next-line import-x/no-extraneous-dependencies
import base from 'mikey-pro/eslint';

export default [
  ...base,

  // integration.test.js runs under node --test (not Jest), uses CJS require()
  // unicorn/prefer-module and jest/* rules do not apply to this Node test runner file
  {
    files: ['tests/integration.test.js'],
    rules: {
      'unicorn/prefer-module': 'off',
      'jest/require-hook': 'off',
      'jest/prefer-expect-assertions': 'off',
      'jest/prefer-ending-with-an-expect': 'off',
      'jest/no-unnecessary-assertion': 'off',
      'jest/no-conditional-in-test': 'off',
      'jest/no-conditional-expect': 'off',
      'jest/prefer-strict-equal': 'off',
    },
  },

  // rule.test.ts uses the existing test suite style — jest opinionated rules
  // (prefer-expect-assertions, require-hook, prefer-ending-with-an-expect) are
  // not practical to add retroactively without rewriting all 32 tests.
  // no-unnecessary-assertion, no-conditional-in-test are flagging intentional
  // test patterns specific to this plugin's introspection tests.
  {
    files: ['tests/**/*.test.ts'],
    rules: {
      'jest/prefer-expect-assertions': 'off',
      'jest/require-hook': 'off',
      'jest/prefer-ending-with-an-expect': 'off',
      'jest/no-unnecessary-assertion': 'off',
      'jest/no-conditional-in-test': 'off',
      'jest/no-conditional-expect': 'off',
      'jest/prefer-strict-equal': 'off',
    },
  },
];
