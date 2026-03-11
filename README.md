# eslint-plugin-disable-autofix

🎉 **Supports ESLint 10** 🎉

Disable autofix for ESLint rules without turning them off.

Rules still report violations but `eslint --fix` and IDE quick-fixes won't change your code. Works with any rule from any plugin. ESLint 9 and 10 flat config. Zero dependencies.

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
    'no-var': 'error',
    '@stylistic/semi': ['error', 'always'],
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

## License

MIT
