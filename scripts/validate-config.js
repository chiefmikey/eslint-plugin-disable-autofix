#!/usr/bin/env node

/**
 * Configuration validation utility for eslint-plugin-disable-autofix
 * Helps developers validate their ESLint configurations
 */

const fs = require('fs');
const path = require('path');

function loadConfig(configPath) {
  try {
    const fullPath = path.resolve(configPath);

    if (!fs.existsSync(fullPath)) {
      console.error(`Configuration file not found: ${fullPath}`);
      process.exit(1);
    }

    // Clear require cache for the config file
    delete require.cache[require.resolve(fullPath)];

    const config = require(fullPath);

    // Handle both ESM and CommonJS exports
    if (config.default) {
      return config.default;
    }

    return config;
  } catch (error) {
    console.error(`Failed to load configuration: ${error.message}`);
    process.exit(1);
  }
}

function validateConfiguration(config) {
  try {
    // Import the validator (this will work after the plugin is built)
    const { configValidator } = require('../dist/validator');

    if (!configValidator) {
      console.error('Validator not found. Make sure the plugin is built.');
      process.exit(1);
    }

    console.log('🔍 Validating ESLint configuration...\n');

    const result = configValidator.validateConfig(config);

    if (result.errors.length > 0) {
      console.error('❌ Configuration Errors:');
      result.errors.forEach(error => console.error(`  • ${error}`));
      console.log('');
    }

    if (result.warnings.length > 0) {
      console.warn('⚠️  Configuration Warnings:');
      result.warnings.forEach(warning => console.warn(`  • ${warning}`));
      console.log('');
    }

    if (result.valid && result.errors.length === 0) {
      console.log('✅ Configuration is valid!');
    }

    return result;
  } catch (error) {
    console.error(`Failed to validate configuration: ${error.message}`);
    process.exit(1);
  }
}

function printUsage() {
  console.log(`
Usage: node scripts/validate-config.js <config-file>

Validates an ESLint configuration for compatibility with eslint-plugin-disable-autofix.

Arguments:
  <config-file>  Path to ESLint configuration file (e.g., eslint.config.js)

Examples:
  node scripts/validate-config.js eslint.config.js
  node scripts/validate-config.js .eslintrc.js
  node scripts/validate-config.js config/eslint.js
`);
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    printUsage();
    return;
  }

  const configPath = args[0];
  const config = loadConfig(configPath);
  const result = validateConfiguration(config);

  // Exit with error code if there are validation errors
  if (!result.valid || result.errors.length > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { validateConfiguration, loadConfig };
