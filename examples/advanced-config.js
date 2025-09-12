/**
 * Advanced Configuration Example
 *
 * This example demonstrates advanced configuration options
 * for eslint-plugin-disable-autofix
 */

import disableAutofix from 'eslint-plugin-disable-autofix';

// Configure the plugin with advanced options
disableAutofix.configure({
  // Performance settings
  performanceMode: 'balanced', // 'fast' | 'balanced' | 'thorough'
  persistCache: true,
  cacheTimeout: 3600000, // 1 hour

  // Rule filtering
  ruleWhitelist: [
    'prefer-const',
    'no-unused-vars',
    'no-console',
    'react/jsx-indent',
    '@typescript-eslint/no-unused-vars'
  ],
  ruleBlacklist: [
    'no-debugger',
    'no-alert'
  ],

  // Advanced options
  strictMode: false,
  autoDetectPlugins: true,
  customRulePrefix: 'disable-autofix',
  errorRecovery: true,

  // Monitoring
  trackStats: true,
  enableTelemetry: false,
  debug: false,

  // Validation
  validateConfigs: true
});

// ESLint v9+ Flat Config
export default [
  {
    name: 'main',
    plugins: {
      'disable-autofix': disableAutofix,
    },
    rules: {
      // Disable original rules
      'prefer-const': 'off',
      'no-unused-vars': 'off',
      'no-console': 'off',

      // Enable with autofix disabled
      'disable-autofix/prefer-const': 'error',
      'disable-autofix/no-unused-vars': 'warn',
      'disable-autofix/no-console': 'warn',
    },
  },
  {
    name: 'test',
    files: ['**/*.test.js', '**/*.spec.js'],
    plugins: {
      'disable-autofix': disableAutofix,
    },
    rules: {
      // Allow console in tests
      'disable-autofix/no-console': 'off',
    },
  },
];

// Legacy ESLint v6-7 Config
module.exports = {
  plugins: ['disable-autofix'],
  rules: {
    // Disable original rules
    'prefer-const': 'off',
    'no-unused-vars': 'off',
    'no-console': 'off',

    // Enable with autofix disabled
    'disable-autofix/prefer-const': 'error',
    'disable-autofix/no-unused-vars': 'warn',
    'disable-autofix/no-console': 'warn',
  },
  overrides: [
    {
      files: ['**/*.test.js', '**/*.spec.js'],
      rules: {
        // Allow console in tests
        'disable-autofix/no-console': 'off',
      },
    },
  ],
};
