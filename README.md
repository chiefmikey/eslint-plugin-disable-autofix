# eslint-plugin-disable-autofix

Disable autofix for ESLint rules and prevent them from being formatted without
having to turn them off.

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
