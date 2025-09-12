/**
 * Performance Optimized Configuration
 *
 * This example shows how to configure the plugin for maximum performance
 * in large codebases
 */

import disableAutofix from 'eslint-plugin-disable-autofix';

// Fast mode configuration for maximum performance
disableAutofix.configure({
  // Performance mode
  performanceMode: 'fast',

  // Disable features that impact performance
  persistCache: false,
  autoDetectPlugins: false,
  trackStats: false,
  enableTelemetry: false,
  debug: false,
  validateConfigs: false,

  // Only process specific rules
  ruleWhitelist: [
    'prefer-const',
    'no-unused-vars',
    'no-console',
    'no-debugger'
  ],

  // Error recovery for stability
  errorRecovery: true,
  strictMode: false
});

// ESLint v9+ Flat Config
export default [
  {
    name: 'performance-optimized',
    plugins: {
      'disable-autofix': disableAutofix,
    },
    rules: {
      // Only disable autofix for critical rules
      'prefer-const': 'off',
      'disable-autofix/prefer-const': 'error',

      'no-unused-vars': 'off',
      'disable-autofix/no-unused-vars': 'warn',
    },
  },
];

// For very large codebases, consider using a minimal configuration
export const minimalConfig = [
  {
    name: 'minimal',
    plugins: {
      'disable-autofix': disableAutofix,
    },
    rules: {
      // Only the most essential rules
      'prefer-const': 'off',
      'disable-autofix/prefer-const': 'error',
    },
  },
];
