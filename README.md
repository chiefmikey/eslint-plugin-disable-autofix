# eslint-plugin-disable-autofix

Disable autofix for ESLint rules and prevent them from being formatted without
having to turn them off. Also strips suggestions.

Works with all ESLint core rules and any third-party plugin installed in your
project.

## Install

```sh
npm i -D eslint-plugin-disable-autofix
```

## Configure

Import and include `disable-autofix` in the `plugins` object.

Add prefix `disable-autofix/` to the rule and disable the original.

### Builtin Rules

```js
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

### Third-Party Plugin Rules

```js
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

### Scoped Plugin Rules

```js
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

## Features

- Disables autofix (`--fix`) for any ESLint rule
- Strips suggestions from rule reports
- Supports ESLint core rules
- Supports third-party plugins (`eslint-plugin-*`)
- Supports scoped plugins (`@scope/eslint-plugin-*`)
- Auto-discovers all installed plugins
- Zero configuration required
- ESLint 9+ flat config

## How It Works

The plugin scans your `node_modules` for ESLint and all installed ESLint
plugins. For each rule found, it creates a wrapped version that intercepts
reported problems and removes the `fix` and `suggest` properties. The wrapped
rules are exported with the `disable-autofix/` prefix.

When ESLint runs with `--fix`, the original rule is disabled (`'off'`) and the
wrapped rule reports violations without providing a fix — so the code stays
unchanged.
