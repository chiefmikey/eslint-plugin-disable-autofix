# eslint-plugin-disable-autofix

Disable autofix for ESLint rules and prevent them from being formatted without having to turn them off.

## Requirements

- Node.js 14.x or higher
- ESLint 7.x or higher

## Installation

```sh
npm install --save-dev eslint-plugin-disable-autofix
```

## Usage

### Basic Configuration

Import and include `disable-autofix` in the `plugins` object, then add prefix `disable-autofix/` to the rule and disable the original:

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

### Using with Third-Party Rules

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

### Using with Scoped Rules

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

### Legacy Configuration (ESLint 6-7)

```js
module.exports = {
  plugins: ['disable-autofix'],
  rules: {
    'prefer-const': 'off',
    'disable-autofix/prefer-const': 'warn',
  },
};
```

## Advanced Configuration

### Plugin Options

Configure plugin behavior:

```ts
import disableAutofix from 'eslint-plugin-disable-autofix';

disableAutofix.configure({
  // Performance settings
  performanceMode: 'balanced', // 'fast' | 'balanced' | 'thorough'
  persistCache: true,
  cacheTimeout: 3600000, // 1 hour

  // Rule filtering
  ruleWhitelist: ['prefer-const', 'no-unused-vars'],
  ruleBlacklist: ['no-console'],

  // Advanced options
  strictMode: false,
  autoDetectPlugins: true,
  customRulePrefix: 'disable-autofix',
  errorRecovery: true,

  // Monitoring
  trackStats: true,
  enableTelemetry: false,
  debug: false,
});
```

### Performance Modes

- **fast**: Optimized for speed, skips persistent cache
- **balanced**: Good balance of speed and features (default)
- **thorough**: Maximum features with detailed tracking

### Rule Filtering

```ts
disableAutofix.configure({
  // Only process specific rules
  ruleWhitelist: ['prefer-const', 'no-unused-vars'],

  // Exclude specific rules
  ruleBlacklist: ['no-console'],
});
```

### Custom Rule Prefix

```ts
disableAutofix.configure({
  customRulePrefix: 'no-fix',
});

// Usage: 'no-fix/prefer-const': 'error'
```

## Monorepo Support

The plugin automatically detects and supports various monorepo setups:

- Nx workspaces
- Lerna workspaces
- pnpm workspaces
- Yarn workspaces

Example configuration:

```js
// packages/my-package/.eslintrc.js
module.exports = {
  plugins: ['disable-autofix'],
  rules: {
    '@scope/rule': 'off',
    'disable-autofix/@scope/rule': 'error',
  }
};
```

## Troubleshooting

### Common Issues

**Plugin Not Working**
- Ensure the plugin is properly installed: `npm list eslint-plugin-disable-autofix`
- Check that rules are prefixed with `disable-autofix/`
- Verify the original rule is disabled: `'original-rule': 'off'`

**Performance Issues**
- Enable fast mode: `performanceMode: 'fast'`
- Disable auto-detection: `autoDetectPlugins: false`
- Use rule whitelist: `ruleWhitelist: ['specific-rule']`

### Debug Mode

Enable detailed logging:

```ts
disableAutofix.configure({
  debug: true,
  errorRecovery: true,
});
```

## API Reference

### `disableAutofix.configure(options)`

Configure the plugin with the provided options.

**Options:**
- `performanceMode`: `'fast' | 'balanced' | 'thorough'` - Performance optimization mode
- `persistCache`: `boolean` - Enable persistent caching
- `cacheTimeout`: `number` - Cache timeout in milliseconds
- `ruleWhitelist`: `string[]` - Only process specific rules
- `ruleBlacklist`: `string[]` - Exclude specific rules
- `customRulePrefix`: `string` - Custom prefix for rules
- `strictMode`: `boolean` - Enable strict validation
- `autoDetectPlugins`: `boolean` - Auto-detect plugins
- `errorRecovery`: `boolean` - Continue on errors
- `trackStats`: `boolean` - Track performance statistics
- `enableTelemetry`: `boolean` - Enable anonymous usage statistics
- `debug`: `boolean` - Enable debug logging

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

## License

MIT © [Mikl Wolfe](https://github.com/chiefmikey)

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a list of changes and version history.
