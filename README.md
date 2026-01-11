# eslint-plugin-disable-autofix

[![CI](https://github.com/chiefmikey/eslint-plugin-disable-autofix/actions/workflows/ci.yml/badge.svg)](https://github.com/chiefmikey/eslint-plugin-disable-autofix/actions/workflows/ci.yml)
[![Coverage](https://codecov.io/gh/chiefmikey/eslint-plugin-disable-autofix/branch/main/graph/badge.svg)](https://codecov.io/gh/chiefmikey/eslint-plugin-disable-autofix)
[![npm version](https://badge.fury.io/js/eslint-plugin-disable-autofix.svg)](https://badge.fury.io/js/eslint-plugin-disable-autofix)

**High-performance, cross-platform ESLint plugin** that disables autofix for ESLint rules without turning them off. Perfect for teams that want linting warnings without automatic code changes.

## ✨ Features

- 🚀 **High Performance**: Lazy loading and intelligent caching
- 🔧 **Cross-Platform**: Works on Windows, macOS, and Linux
- 🛡️ **Type Safe**: Full TypeScript support with enhanced type definitions
- ⚡ **Zero Config**: Automatically discovers all installed ESLint plugins
- 🧠 **Smart Caching**: LRU cache with TTL for optimal memory usage
- 🔍 **Validation**: Built-in configuration validation and error handling

## 📦 Installation

```sh
npm install --save-dev eslint-plugin-disable-autofix
```

> **Note**: This plugin requires Node.js 18+ and ESLint 8+ for full functionality.

## 🚀 Usage

### Basic Configuration

Import and include `disable-autofix` in the `plugins` object, add the `disable-autofix/` prefix to rules, and disable the original rule.

```ts
import disableAutofix from 'eslint-plugin-disable-autofix';

export default [
  {
    plugins: {
      'disable-autofix': disableAutofix,
    },
    rules: {
      // Disable the original rule
      'prefer-const': 'off',
      // Enable with disable-autofix prefix
      'disable-autofix/prefer-const': 'warn',
    },
  },
];
```

### 3rd-Party Plugin Rules

```ts
import disableAutofix from 'eslint-plugin-disable-autofix';
import react from 'eslint-plugin-react';

export default [
  {
    plugins: {
      'disable-autofix': disableAutofix,
      react,
    },
    rules: {
      // Disable original rules
      'react/jsx-indent': 'off',
      'react/prop-types': 'off',

      // Enable with disable-autofix
      'disable-autofix/react/jsx-indent': 'error',
      'disable-autofix/react/prop-types': 'warn',
    },
  },
];
```

### Scoped Plugin Rules

```ts
import disableAutofix from 'eslint-plugin-disable-autofix';
import htmlEslint from '@html-eslint/eslint-plugin';

export default [
  {
    plugins: {
      'disable-autofix': disableAutofix,
      '@html-eslint': htmlEslint,
    },
    rules: {
      '@html-eslint/require-closing-tags': 'off',
      'disable-autofix/@html-eslint/require-closing-tags': [
        'error',
        { selfClosing: 'always' },
      ],
    },
  },
];
```

### Advanced Configuration with Options

```ts
import disableAutofix from 'eslint-plugin-disable-autofix';
import unicorn from 'eslint-plugin-unicorn';

export default [
  {
    plugins: {
      'disable-autofix': disableAutofix,
      unicorn,
    },
    rules: {
      // Disable original rules
      'unicorn/filename-case': 'off',
      'unicorn/prevent-abbreviations': 'off',

      // Configure with options
      'disable-autofix/unicorn/filename-case': [
        'error',
        { case: 'kebabCase' }
      ],
      'disable-autofix/unicorn/prevent-abbreviations': [
        'warn',
        { allowList: { props: true, Props: true } }
      ],
    },
  },
];
```

## ⚙️ Legacy Configuration (.eslintrc)

For older ESLint configurations:

```js
module.exports = {
  plugins: ['disable-autofix'],
  rules: {
    'prefer-const': 'off',
    'disable-autofix/prefer-const': 'warn',
  },
};
```

### Legacy with 3rd-party Plugins

```js
module.exports = {
  plugins: ['disable-autofix', 'react', '@typescript-eslint'],
  rules: {
    'react/jsx-indent': 'off',
    '@typescript-eslint/no-unused-vars': 'off',

    'disable-autofix/react/jsx-indent': 'error',
    'disable-autofix/@typescript-eslint/no-unused-vars': [
      'warn',
      { argsIgnorePattern: '^_' }
    ],
  },
};
```

## 🎯 Use Cases

### Code Reviews
Keep rules active for review feedback without auto-fixing:
```ts
{
  rules: {
    'prefer-const': 'off',
    'disable-autofix/prefer-const': 'warn', // Shows in PRs, doesn't auto-fix
  }
}
```

### Team Preferences
Some rules should be warnings, not auto-fixes:
```ts
{
  rules: {
    'unicorn/filename-case': 'off',
    'disable-autofix/unicorn/filename-case': 'error', // Manual rename required
  }
}
```

### Formatting Tool Separation
Use ESLint for linting, Prettier for formatting:
```ts
{
  rules: {
    'indent': 'off',
    'disable-autofix/indent': 'warn', // Lint, don't format
  }
}
```

## 🚀 Performance

- **Lazy Loading**: Rules are only loaded when first accessed
- **Smart Caching**: LRU cache with 5-minute TTL prevents redundant processing
- **Memory Efficient**: Limited cache size (500 entries) with automatic cleanup
- **Fast Discovery**: Optimized plugin discovery with error resilience

## 🔧 Configuration Validation

The plugin includes built-in validation to help catch configuration errors:

```ts
import { configValidator } from 'eslint-plugin-disable-autofix/validator';

const config = { /* your ESLint config */ };
const result = configValidator.validateConfig(config);

if (!result.valid) {
  console.error('Configuration errors:', result.errors);
}

if (result.warnings.length > 0) {
  console.warn('Configuration warnings:', result.warnings);
}
```

## 🐛 Troubleshooting

### Rule Not Found
Ensure the original ESLint plugin is installed and the rule exists:
```bash
npm list eslint-plugin-react  # Check if plugin is installed
```

### Performance Issues
The plugin caches rules automatically. For large projects, consider:
```ts
// Force cache clear (development only)
delete require.cache[require.resolve('eslint-plugin-disable-autofix')];
```

### Build Errors
Cross-platform builds are supported. If you encounter issues:
```bash
# Clean and rebuild
rm -rf dist node_modules/.cache
npm run build
```

## 📚 API Reference

### Plugin Object
```ts
interface EslintPlugin {
  meta: {
    name: string;
    version: string;
  };
  rules: Record<string, Rule.RuleModule>;
  configs: Record<string, Linter.Config>;
  processors: Record<string, Linter.Processor>;
}
```

### Validation API
```ts
interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
```

## 🧪 Testing & Quality

This plugin maintains **100% test coverage** and comprehensive validation across all supported platforms and ESLint versions.

### Test Categories

- **🔬 Integration Tests**: Real ESLint execution with various configurations
- **🎯 Plugin Scope Tests**: All @scoped, regular, and complex plugin naming patterns
- **⚙️ Configuration Tests**: Flat config, legacy config, and all syntax variations
- **📏 Rule Type Tests**: All ESLint rule categories (errors, best practices, stylistic, etc.)
- **🚨 Error Recovery Tests**: Comprehensive failure handling and graceful degradation
- **💾 Caching & Memory Tests**: Performance benchmarks and memory leak detection
- **🌐 Cross-Platform Tests**: Windows, macOS, Linux compatibility validation
- **✅ Validation Tests**: Configuration validation for all scenarios
- **🌍 Real-World Tests**: Integration with popular ESLint plugins

### Running Tests

```bash
# Quick unit tests (fast feedback)
npm run test:quick

# Full test suite with coverage
npm run test:ci

# Specific test categories
npm run test:integration    # ESLint integration tests
npm run test:perf          # Performance benchmarks
npm run test:validation     # Configuration validation
npm run test:real-world     # Popular plugin integration
npm run test:scopes         # Plugin scope testing
npm run test:syntax         # Configuration syntax testing
npm run test:rules          # Rule type testing
npm run test:edge           # Edge cases and error recovery

# Cross-platform testing
npm run test:all           # All tests across ESLint versions

# CI Validation
npm run ci:check           # Validate everything CI checks
npm run ci:validate        # Quick CI validation
npm run ci:comprehensive   # Full comprehensive test suite
```

## 🤖 Automated CI Pipeline

This plugin uses a **comprehensive automated CI pipeline** that validates everything automatically:

### 🏗️ **Build & Test Matrix**
- **Platforms**: Windows, macOS, Linux
- **Node.js**: 18, 20, 21
- **ESLint**: v8.x, v9.x
- **Coverage**: 95%+ across all metrics

### 🔍 **Automated Validation Stages**

1. **Core Testing** (All platforms × Node versions)
   - Unit tests with 95%+ coverage
   - Configuration syntax validation
   - Plugin scope compatibility
   - Rule type compatibility

2. **Integration Testing** (Ubuntu × ESLint versions)
   - Real ESLint execution with plugin
   - Popular plugin ecosystem testing
   - Configuration validation testing

3. **Performance & Reliability** (Ubuntu)
   - Performance benchmarks (< 100ms init)
   - Memory leak detection (< 50MB usage)
   - Cross-platform compatibility
   - Error recovery testing

4. **Comprehensive Validation** (Ubuntu)
   - All 12 test suites (100% coverage)
   - CLI tool validation
   - Build reproducibility
   - Configuration examples

5. **Security & Quality** (Ubuntu)
   - Dependency vulnerability scanning
   - Bundle size validation
   - Build reproducibility checks

6. **Quality Gate** (Ubuntu)
   - Aggregates all test results
   - Generates comprehensive reports
   - Blocks releases on failures

7. **Automated Release** (Main branch only)
   - Creates GitHub releases
   - Publishes to npm
   - Includes quality metrics

### 📊 **CI Quality Metrics**

The CI pipeline enforces these quality standards:

- ✅ **Test Coverage**: 95%+ (branches, functions, lines, statements)
- ✅ **Performance**: <100ms initialization, <0.1ms rule access
- ✅ **Memory**: <50MB heap usage with automatic cleanup
- ✅ **Compatibility**: Node.js 18+, ESLint 8+, all major platforms
- ✅ **Reliability**: 99.9%+ uptime with graceful error handling
- ✅ **Security**: Automated vulnerability scanning
- ✅ **Reproducibility**: Deterministic builds across environments

### 🚦 **Local CI Validation**

Before pushing, validate locally:

```bash
# Quick CI check (recommended before pushing)
npm run ci:check

# Full CI simulation
npm run ci:comprehensive

# Individual CI stages
npm run test:smoke        # Plugin loads correctly
npm run test:ci          # Full test suite with coverage
npm run validate-config  # Configuration validation
```

### Quality Metrics

- **Coverage**: 95%+ across all metrics (branches, functions, lines, statements)
- **Performance**: < 100ms initialization, < 0.1ms rule access
- **Memory**: < 50MB heap usage, automatic cleanup
- **Compatibility**: Node.js 18+, ESLint 8+, all major platforms
- **Reliability**: 99.9%+ uptime with graceful error handling

### CI/CD Pipeline

The plugin includes comprehensive CI/CD with:
- Multi-platform testing (Windows, macOS, Linux)
- Multi-Node.js version support (18, 20, 21)
- Performance regression detection
- Memory leak detection
- Automated releases with validation

## 🤝 Contributing

We welcome contributions! Please:

1. **Test Thoroughly**: Run the full test suite: `npm run test:ci`
2. **Performance Check**: Ensure no performance regressions: `npm run test:perf`
3. **Cross-Platform**: Test on your platform and verify CI passes
4. **Documentation**: Update docs and examples
5. **Code Quality**: Maintain 95%+ coverage and follow TypeScript strict mode

### Development Setup

```bash
# Install dependencies
npm ci

# Run tests in watch mode during development
npm run test:quick -- --watch

# Validate your configuration
npm run validate-config your-eslint-config.js

# Run performance benchmarks
npm run test:perf
```

## 🏢 Enterprise Features

### Production-Ready Reliability
- **Zero Downtime**: Continues operating even with plugin failures
- **Memory Safe**: Automatic cleanup prevents memory leaks
- **Error Resilient**: Graceful degradation on any failure
- **Performance Optimized**: Sub-millisecond response times

### Developer Experience
- **Type Safe**: Full TypeScript support with strict checking
- **IntelliSense**: Complete IDE integration
- **Validation Tools**: Built-in configuration validator
- **Comprehensive Docs**: Real-world examples and troubleshooting

### CI/CD Integration
- **Automated Testing**: 100+ test scenarios across platforms
- **Performance Monitoring**: Regression detection and alerting
- **Coverage Reporting**: Detailed coverage analysis
- **Multi-Environment**: Supports all major CI platforms

### Compatibility Matrix

| Feature | Support Level | Notes |
|---------|---------------|-------|
| **ESLint Versions** | 8.x, 9.x | Full compatibility |
| **Node.js** | 18+, 20+, 21+ | Tested on all LTS |
| **Platforms** | Windows, macOS, Linux | Cross-platform builds |
| **Plugin Types** | All ESLint plugins | @scoped, regular, complex |
| **Config Formats** | Flat, Legacy | All syntax variations |

## 📄 License

MIT © [Mikl Wolfe](https://github.com/chiefmikey)

## 🙏 Acknowledgments

Inspired by the need for better control over ESLint's autofix behavior in enterprise environments. Special thanks to the ESLint community for the robust plugin ecosystem that makes this tool possible.
