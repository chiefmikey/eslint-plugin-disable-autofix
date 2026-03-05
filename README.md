# eslint-plugin-disable-autofix

Disable autofix for ESLint rules without turning them off.

Wraps any rule to strip `fix` and `suggest` from `context.report()`, preventing `--fix` and IDE quick-fix suggestions from modifying code. The original violation is still reported.

Works with ESLint 9 and 10 flat config. Supports builtin rules, third-party plugins, scoped plugins, and ESM-only plugins. Auto-discovers all installed plugins. Zero dependencies.

## Install

```sh
npm i -D eslint-plugin-disable-autofix
```

## Usage

### configure()

The `configure()` helper handles the boilerplate of disabling the original rule and enabling the prefixed version:

```js
// eslint.config.js
import disableAutofix from 'eslint-plugin-disable-autofix';

export default [
  disableAutofix.configure({
    'prefer-const': 'warn',
    'semi': ['error', 'always'],
    '@stylistic/semi': ['error', 'always'],
    'react/jsx-indent': 'error',
  }),
];
```

### Manual setup

```js
import disableAutofix from 'eslint-plugin-disable-autofix';

export default [
  {
    plugins: { 'disable-autofix': disableAutofix },
    rules: {
      'prefer-const': 'off',
      'disable-autofix/prefer-const': 'warn',
    },
  },
];
```

### Selective modes

By default, both autofix and suggestions are stripped. Use `createPlugin()` to strip one or the other:

```js
import disableAutofix from 'eslint-plugin-disable-autofix';

// Strip autofix only — keep IDE suggestions
const disableFix = disableAutofix.createPlugin({ mode: 'fix' });

// Strip suggestions only — keep autofix
const disableSuggest = disableAutofix.createPlugin({ mode: 'suggest' });

export default [
  disableFix.configure({ 'prefer-const': 'warn' }),
  disableSuggest.configure({ 'no-console': 'warn' }),
];
```

### Restrict to specific plugins

```js
const limited = disableAutofix.createPlugin({ plugins: ['react', 'unicorn'] });
```

Only wraps rules from the listed plugin prefixes. Builtin ESLint rules are always included.

## How it works

The plugin scans `node_modules` for ESLint and all installed ESLint plugins. Rules are loaded lazily — only when accessed. For each rule, it creates a wrapped version that intercepts `context.report()` and deletes the `fix` and `suggest` properties before forwarding. It also removes `fixable` and `hasSuggestions` from rule metadata so ESLint and IDEs don't advertise fixes.

## License

MIT
