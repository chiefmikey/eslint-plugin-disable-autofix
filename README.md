# eslint-plugin-disable-autofix

Disable autofix for ESLint rules without turning them off.

Wraps any rule to strip `fix` and `suggest` from `context.report()`, preventing `--fix` and IDE quick-fix suggestions from modifying code. The original violation is still reported.

Works with ESLint 9 and 10 flat config. Supports builtin rules, third-party plugins, scoped plugins, and ESM-only plugins. Auto-discovers all installed plugins. Zero dependencies.

## Install

```sh
npm i -D eslint-plugin-disable-autofix
```

## Usage

```js
// eslint.config.js
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

Third-party and scoped plugins work the same way:

```js
import disableAutofix from 'eslint-plugin-disable-autofix';
import react from 'eslint-plugin-react';
import stylistic from '@stylistic/eslint-plugin';

export default [
  {
    plugins: {
      'disable-autofix': disableAutofix,
      react,
      '@stylistic': stylistic,
    },
    rules: {
      'react/jsx-indent': 'off',
      'disable-autofix/react/jsx-indent': 'error',
      '@stylistic/semi': 'off',
      'disable-autofix/@stylistic/semi': ['error', 'always'],
    },
  },
];
```

## How it works

The plugin scans `node_modules` for ESLint and all installed ESLint plugins. For each rule, it creates a wrapped version that intercepts `context.report()` and deletes the `fix` and `suggest` properties before forwarding. It also removes `fixable` and `hasSuggestions` from rule metadata so ESLint and IDEs don't advertise fixes.

## License

MIT
