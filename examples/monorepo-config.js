/**
 * Monorepo Configuration Example
 *
 * This example shows how to configure the plugin in a monorepo setup
 * with Nx, Lerna, pnpm, or Yarn workspaces
 */

import disableAutofix from 'eslint-plugin-disable-autofix';

// Configure for monorepo
disableAutofix.configure({
  // Enable auto-detection for monorepo plugins
  autoDetectPlugins: true,

  // Performance settings for large codebases
  performanceMode: 'balanced',
  persistCache: true,
  cacheTimeout: 7200000, // 2 hours for monorepos

  // Rule filtering for monorepo-specific rules
  ruleWhitelist: [
    'prefer-const',
    'no-unused-vars',
    'no-console',
    '@nx/enforce-module-boundaries',
    '@typescript-eslint/no-unused-vars',
    'react/jsx-indent'
  ],

  // Error recovery for stability
  errorRecovery: true,
  strictMode: false,

  // Monitoring for large teams
  trackStats: true,
  enableTelemetry: false
});

// Root workspace configuration
export default [
  {
    name: 'root',
    plugins: {
      'disable-autofix': disableAutofix,
    },
    rules: {
      // Global rules
      'prefer-const': 'off',
      'disable-autofix/prefer-const': 'error',
    },
  },
  {
    name: 'apps',
    files: ['apps/**/*.{js,ts,jsx,tsx}'],
    plugins: {
      'disable-autofix': disableAutofix,
    },
    rules: {
      // App-specific rules
      'no-console': 'off',
      'disable-autofix/no-console': 'warn',
    },
  },
  {
    name: 'libs',
    files: ['libs/**/*.{js,ts,jsx,tsx}'],
    plugins: {
      'disable-autofix': disableAutofix,
    },
    rules: {
      // Library-specific rules
      'no-console': 'off',
      'disable-autofix/no-console': 'error',
    },
  },
  {
    name: 'tests',
    files: ['**/*.test.{js,ts,jsx,tsx}', '**/*.spec.{js,ts,jsx,tsx}'],
    plugins: {
      'disable-autofix': disableAutofix,
    },
    rules: {
      // Test-specific rules
      'no-console': 'off',
      'disable-autofix/no-console': 'off',
    },
  },
];

// Nx-specific configuration
export const nxConfig = [
  {
    name: 'nx-workspace',
    plugins: {
      'disable-autofix': disableAutofix,
    },
    rules: {
      // Nx-specific rules
      '@nx/enforce-module-boundaries': 'off',
      'disable-autofix/@nx/enforce-module-boundaries': 'error',
    },
  },
];

// Package-specific configuration (for individual packages)
export const packageConfig = {
  plugins: ['disable-autofix'],
  rules: {
    'prefer-const': 'off',
    'disable-autofix/prefer-const': 'error',
  },
};
