# eslint-plugin-disable-autofix

Disable autofix for ESLint rules and prevent them from being formatted without
having to turn them off.

## Requirements

- Node.js 14.x or higher
- ESLint 7.x or higher

## Usage

### Install

```sh
npm i -D eslint-plugin-disable-autofix
```

### Configure

Import and include `disable-autofix` in the `plugins` object

Add prefix `disable-autofix/` to the rule and disable the original

```ts
import disableAutofix from 'eslint-plugin-disable-autofix';

export default [
  {
    plugins: {
      'disable-autofix': disableAutofix,
    },
    rules: {
      'prefer-const': 'off',
      'disable-autofix/prefer-const': 'warn',
    },
  },
];
```

Using 3rd-party Rules

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
      'react/jsx-indent': 'off',
      'disable-autofix/react/jsx-indent': 'error',
    },
  },
];
```

Using Scoped Rules

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

### Using with Nx

For Nx monorepos, the plugin automatically detects Nx workspace structure and adjusts paths accordingly.

```ts
// apps/my-app/.eslintrc.js
import disableAutofix from 'eslint-plugin-disable-autofix';

export default [
  {
    plugins: {
      'disable-autofix': disableAutofix,
    },
    rules: {
      '@nx/enforce-module-boundaries': 'off',
      'disable-autofix/@nx/enforce-module-boundaries': 'error'
    },
  },
];
```

Using with Nx preset:

```js
// apps/my-app/.eslintrc.js
module.exports = {
  extends: ['plugin:@nx/react'],
  plugins: ['disable-autofix'],
  rules: {
    '@nx/enforce-module-boundaries': 'off',
    'disable-autofix/@nx/enforce-module-boundaries': 'error'
  }
};
```

### Using in Monorepos

The plugin automatically detects and supports various monorepo setups:

- Nx workspaces
- Lerna workspaces
- pnpm workspaces
- Yarn workspaces

Example configuration for any monorepo setup:

```js
// packages/my-package/.eslintrc.js
module.exports = {
  plugins: ['disable-autofix'],
  rules: {
    // Works with workspace-level plugins
    '@scope/rule': 'off',
    'disable-autofix/@scope/rule': 'error',

    // Works with package-level plugins
    'local-plugin/rule': 'off',
    'disable-autofix/local-plugin/rule': 'error'
  }
};
```

For yarn/pnpm workspaces, ensure the plugin is installed in your root `package.json`:

```json
{
  "workspaces": ["packages/*"],
  "dependencies": {
    "eslint-plugin-disable-autofix": "^5.0.1"
  }
}
```

### Configure Legacy

Include `disable-autofix` in the `eslintrc` plugins array

Add prefix `disable-autofix/` to the rule and disable the original

```js
module.exports = {
  plugins: ['disable-autofix'],
  rules: {
    'prefer-const': 'off',
    'disable-autofix/prefer-const': 'warn',
  },
};
```

Using 3rd-party Rules

```js
module.exports = {
  plugins: ['disable-autofix', 'react'],
  rules: {
    'react/jsx-indent': 'off',
    'disable-autofix/react/jsx-indent': 'error',
  },
};
```

Using Scoped Rules

```js
module.exports = {
  plugins: ['disable-autofix', '@html-eslint'],
  rules: {
    '@html-eslint/require-closing-tags': 'off',
    'disable-autofix/@html-eslint/require-closing-tags': [
      'error',
      { selfClosing: 'always' },
    ],
  },
};
```

### ESLint Version Compatibility

The plugin supports both traditional and flat configs:

#### ESLint 8+ (Flat Config)
```js
import disableAutofix from 'eslint-plugin-disable-autofix';

export default [{
  plugins: {
    'disable-autofix': disableAutofix
  },
  rules: {
    'prefer-const': 'off',
    'disable-autofix/prefer-const': 'error'
  }
}];
```

#### ESLint 6-7 (Traditional Config)
```js
module.exports = {
  plugins: ['disable-autofix'],
  extends: ['plugin:disable-autofix/recommended'],
  rules: {
    'prefer-const': 'off',
    'disable-autofix/prefer-const': 'error'
  }
};
```

#### Using Predefined Configs

The plugin provides three predefined configurations:

- `plugin:disable-autofix/recommended` - Auto-detects ESLint version and uses appropriate config
- `plugin:disable-autofix/legacy` - For traditional ESLint config (v6-7)
- `plugin:disable-autofix/flat` - For ESLint flat config (v8+)

## Advanced Configuration

### Plugin Options

Configure plugin behavior:

```ts
import disableAutofix from 'eslint-plugin-disable-autofix';

disableAutofix.configure({
  // Enable anonymous usage statistics
  enableTelemetry: false,
  // Cache timeout in milliseconds
  cacheTimeout: 3600000,
  // Only disable autofix for specific rules
  includeRules: ['prefer-const', 'no-unused-vars'],
  // Exclude specific rules from being disabled
  excludeRules: ['no-console'],
  // Enable debug logging
  debug: false
});
```

### Migration Helpers

Convert legacy configurations:

```ts
import { migrationHelpers } from 'eslint-plugin-disable-autofix';

// Convert legacy config
const newConfig = migrationHelpers.convertLegacyConfig(oldConfig);

// Generate config from rule list
const config = migrationHelpers.generateConfigFromRules([
  'prefer-const',
  'no-unused-vars'
]);
```

### Telemetry

When enabled, telemetry collects anonymous usage data:
- Number of rules processed
- Cache hit/miss ratio
- Error counts

No personal or project-specific information is collected.

Enable with:
```ts
disableAutofix.configure({ enableTelemetry: true });
```

## Performance

The plugin includes several performance optimization features:

### Performance Modes

Configure performance behavior with the `performanceMode` option:

```ts
import disableAutofix from 'eslint-plugin-disable-autofix';

disableAutofix.configure({
  performanceMode: 'fast', // 'fast' | 'balanced' | 'thorough'
});
```

- **fast**: Optimized for speed, skips persistent cache
- **balanced**: Good balance of speed and features (default)
- **thorough**: Maximum features with detailed tracking

### Caching

Enable persistent caching for faster subsequent runs:

```ts
disableAutofix.configure({
  persistCache: true,
  cacheTimeout: 3600000, // 1 hour
});
```

### Statistics Tracking

Monitor plugin performance:

```ts
disableAutofix.configure({
  trackStats: true,
  enableTelemetry: true,
});
```

Enable debug logging to see performance metrics:

```bash
DEBUG=1 npx eslint .
```

## Troubleshooting

### Common Issues

#### Plugin Not Working
- Ensure the plugin is properly installed: `npm list eslint-plugin-disable-autofix`
- Check that rules are prefixed with `disable-autofix/`
- Verify the original rule is disabled: `'original-rule': 'off'`

#### Performance Issues
- Enable fast mode: `performanceMode: 'fast'`
- Disable auto-detection: `autoDetectPlugins: false`
- Use rule whitelist: `ruleWhitelist: ['specific-rule']`

#### TypeScript Issues
- Ensure TypeScript declarations are installed
- Check that `@types/eslint` is up to date
- Use the provided type definitions

### Debug Mode

Enable detailed logging:

```ts
disableAutofix.configure({
  debug: true,
  errorRecovery: true,
});
```

### Error Recovery

The plugin includes error recovery to handle problematic rules:

```ts
disableAutofix.configure({
  errorRecovery: true, // Continue on errors (default: true)
  strictMode: false,   // Strict validation (default: false)
});
```

## Advanced Configuration

### Custom Rule Prefix

Use a custom prefix for rules:

```ts
disableAutofix.configure({
  customRulePrefix: 'no-fix',
});

// Usage:
// 'no-fix/prefer-const': 'error'
```

### Rule Filtering

Advanced rule filtering options:

```ts
disableAutofix.configure({
  // Only process specific rules
  ruleWhitelist: ['prefer-const', 'no-unused-vars'],

  // Exclude specific rules
  ruleBlacklist: ['no-console'],

  // Legacy options (still supported)
  includeRules: ['prefer-const'],
  excludeRules: ['no-console'],
});
```

### Strict Mode

Enable strict validation for rule schemas:

```ts
disableAutofix.configure({
  strictMode: true,
  validateConfigs: true,
});
```

## Migration Guide

### From Other Plugins

#### From eslint-plugin-disable
```js
// Before
module.exports = {
  plugins: ['disable'],
  rules: {
    'disable/disable': ['error', { paths: ['src/**/*.test.js'] }]
  }
};

// After
module.exports = {
  plugins: ['disable-autofix'],
  rules: {
    'prefer-const': 'off',
    'disable-autofix/prefer-const': 'error'
  }
};
```

#### From eslint-plugin-fix-later
```js
// Before
module.exports = {
  plugins: ['fix-later'],
  rules: {
    'fix-later/prefer-const': 'warn'
  }
};

// After
module.exports = {
  plugins: ['disable-autofix'],
  rules: {
    'prefer-const': 'off',
    'disable-autofix/prefer-const': 'warn'
  }
};
```

### Upgrading from v4 to v5

1. Update package: `npm install eslint-plugin-disable-autofix@latest`
2. New configuration options are available but optional
3. All existing configurations continue to work
4. Consider enabling new features for better performance

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
git clone https://github.com/chiefmikey/eslint-plugin-disable-autofix.git
cd eslint-plugin-disable-autofix
npm install
npm run build
npm test
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific ESLint version tests
npm run gh-test-v8  # ESLint v8
npm run gh-test-v9  # ESLint v9

# Run benchmarks
npm run benchmark
```

## License

MIT © [Mikl Wolfe](https://github.com/chiefmikey)

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a list of changes and version history.

## Support

- 📖 [Documentation](https://github.com/chiefmikey/eslint-plugin-disable-autofix#readme)
- 🐛 [Report Issues](https://github.com/chiefmikey/eslint-plugin-disable-autofix/issues)
- 💬 [Discussions](https://github.com/chiefmikey/eslint-plugin-disable-autofix/discussions)
- 📧 [Email Support](mailto:wolfe@mikl.io)
