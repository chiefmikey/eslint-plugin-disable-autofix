import babelPlugin from '@babel/eslint-plugin';
import type { Linter } from 'eslint';
import eslintPluginUnicorn from 'eslint-plugin-unicorn';

import disableAutofix from 'eslint-plugin-disable-autofix';

const baseConfig = {
  languageOptions: {
    ecmaVersion: 2024,
  },
};

export const builtin = {
  fix: {
    ...baseConfig,
    rules: {
      'no-unused-vars': 'off',
      'prefer-const': 'warn',
      'eol-last': 'off',
    },
  } as Linter.FlatConfig,
  disable: {
    ...baseConfig,
    plugins: { 'disable-autofix': disableAutofix },
    rules: {
      'prefer-const': 'off',
      'disable-autofix/prefer-const': 'warn',
      'no-unused-vars': 'off',
      'eol-last': 'off',
    },
  } as Linter.FlatConfig,
};

export const unicorn = {
  fix: {
    ...baseConfig,
    plugins: { unicorn: eslintPluginUnicorn },
    rules: {
      'unicorn/prevent-abbreviations': 'warn',
      'eol-last': 'off',
    },
  } as Linter.FlatConfig,
  disable: {
    ...baseConfig,
    plugins: {
      'disable-autofix': disableAutofix,
      unicorn: eslintPluginUnicorn,
    },
    rules: {
      'unicorn/prevent-abbreviations': 'off',
      'disable-autofix/unicorn/prevent-abbreviations': 'warn',
      'eol-last': 'off',
    },
  } as Linter.FlatConfig,
};

export const babel = {
  fix: {
    ...baseConfig,
    plugins: { '@babel': babelPlugin },
    rules: {
      '@babel/object-curly-spacing': 'warn',
      'eol-last': 'off',
    },
  } as Linter.FlatConfig,
  disable: {
    ...baseConfig,
    plugins: { 'disable-autofix': disableAutofix, '@babel': babelPlugin },
    rules: {
      '@babel/object-curly-spacing': 'off',
      'disable-autofix/@babel/object-curly-spacing': 'warn',
      'eol-last': 'off',
    },
  } as Linter.FlatConfig,
};
