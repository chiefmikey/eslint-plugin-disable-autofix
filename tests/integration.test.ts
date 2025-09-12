import { describe, expect, it, beforeEach } from '@jest/globals';
import { ESLint } from 'eslint';
import plugin from '../src/index';
import babelPlugin from '@babel/eslint-plugin';
import unicornPlugin from 'eslint-plugin-unicorn';

describe('Integration Tests - ESLint Plugin', () => {
  let eslint: ESLint;

  beforeEach(() => {
    eslint = new ESLint({
      baseConfig: {
        languageOptions: {
          ecmaVersion: 2024,
          sourceType: 'module',
        },
        plugins: {
          'disable-autofix': plugin as any,
          '@babel': babelPlugin as any,
          unicorn: unicornPlugin as any,
        },
        rules: {
          // Disable original rules
          'object-curly-spacing': 'off',
          'prevent-abbreviations': 'off',
          // Enable disable-autofix versions
          'disable-autofix/object-curly-spacing': 'error',
          'disable-autofix/prevent-abbreviations': 'error',
        },
      },
    });
  });

  it('should work with basic ESLint rules', async () => {
    const code = 'const x = 1;';
    const results = await eslint.lintText(code);

    expect(results).toHaveLength(1);
    expect(results[0].messages).toHaveLength(0);
  });

  it('should work with third-party plugin rules', async () => {
    const code = 'const obj = { a: 1, b: 2 };';
    const results = await eslint.lintText(code);

    expect(results).toHaveLength(1);
    // Should not have autofix suggestions even though the original rule is fixable
    expect(results[0].messages).toHaveLength(0);
  });

  it('should work with scoped rules', async () => {
    const code = 'const obj = { a: 1, b: 2 };';
    const results = await eslint.lintText(code);

    expect(results).toHaveLength(1);
    expect(results[0].messages).toHaveLength(0);
  });

  it('should handle multiple rules simultaneously', async () => {
    const code = 'const obj = { a: 1, b: 2 }; const x = 1;';
    const results = await eslint.lintText(code);

    expect(results).toHaveLength(1);
    expect(results[0].messages).toHaveLength(0);
  });

  it('should work with different rule configurations', async () => {
    const eslintWithConfig = new ESLint({
      baseConfig: {
        languageOptions: {
          ecmaVersion: 2024,
          sourceType: 'module',
        },
        plugins: {
          'disable-autofix': plugin as any,
          '@babel': babelPlugin as any,
        },
        rules: {
          'object-curly-spacing': 'off',
          'disable-autofix/object-curly-spacing': ['error', 'always'],
        },
      },
    });

    const code = 'const obj = {a: 1, b: 2};';
    const results = await eslintWithConfig.lintText(code);

    expect(results).toHaveLength(1);
    expect(results[0].messages).toHaveLength(0);
  });
});
