import { ESLint } from 'eslint';

const baseConfig = {
  root: true,
  env: {
    es2024: true,
  },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
};

export const builtin = {
  fix: {
    ...baseConfig,
    extends: ['eslint:all'],
    rules: {
      'no-unused-vars': 0,
      'prefer-const': 1,
      'eol-last': 0,
    },
  } as ESLint.ConfigData,
  disable: {
    ...baseConfig,
    plugins: ['disable-autofix'],
    extends: ['eslint:all'],
    rules: {
      'prefer-const': 0,
      'disable-autofix/prefer-const': 1,
      'no-unused-vars': 0,
      'eol-last': 0,
    },
  } as ESLint.ConfigData,
};

export const unicorn = {
  fix: {
    ...baseConfig,
    plugins: ['unicorn'],
    extends: ['plugin:unicorn/recommended'],
    rules: {
      'unicorn/prevent-abbreviations': 1,
      'eol-last': 0,
    },
  } as ESLint.ConfigData,
  disable: {
    ...baseConfig,
    plugins: ['disable-autofix', 'unicorn'],
    extends: ['plugin:unicorn/recommended'],
    rules: {
      'unicorn/prevent-abbreviations': 0,
      'disable-autofix/unicorn/prevent-abbreviations': 1,
      'eol-last': 0,
    },
  } as ESLint.ConfigData,
};

export const babel = {
  fix: {
    ...baseConfig,
    plugins: ['@babel'],
    rules: {
      '@babel/object-curly-spacing': 1,
      'eol-last': 0,
    },
  } as ESLint.ConfigData,
  disable: {
    ...baseConfig,
    plugins: ['disable-autofix', '@babel'],
    rules: {
      '@babel/object-curly-spacing': 0,
      'disable-autofix/@babel/object-curly-spacing': 1,
      'eol-last': 0,
    },
  } as ESLint.ConfigData,
};
