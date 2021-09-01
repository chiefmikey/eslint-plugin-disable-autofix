# eslint-plugin-no-autofix-2

Disable ESLint autofix (--fix) for specified rules

Supports [all eslint core rules](https://eslint.org/docs/rules/) and 3rd-party
plugins (_including_ scoped packages)

_This plugin is built from
[eslint-plugin-no-autofix](https://github.com/aladdin-add/eslint-plugin/tree/master/packages/no-autofix)
and extends compatibility to scoped packages_

## Usage

### Install

```bash
$ npm i eslint-plugin-no-autofix-2 -D
$ yarn add eslint-plugin-no-autofix-2 -D
```

### Configure

Add prefix 'no-autofix-2/' to the rule name in eslintrc and disable the
original:

```js
module.exports = {
  plugins: ['no-autofix-2'],
  rules: {
    'prefer-const': 'off',
    'no-autofix-2/prefer-const': 'error',
  },
};
```

Use 3rd-party plugins:

```js
module.exports = {
  plugins: ['no-autofix', 'react'],
  rules: {
    'react/jsx-indent': 'off',
    'no-autofix/react/jsx-indent': 'error',
  },
};
```

Use scoped plugins:

```js
module.exports = {
  plugins: ['no-autofix', '@html-eslint'],
  rules: {
    '@html-eslint/require-closing-tags': 'off',
    'no-autofix-2/@html-eslint/require-closing-tags': [
      'error',
      { selfClosing: 'always' },
    ],
  },
};
```

## Depends on

- [ESLint](https://eslint.org)
- [eslint-rule-composer](https://github.com/not-an-aardvark/eslint-rule-composer)
- [eslint-plugin-no-autofix](https://github.com/aladdin-add/eslint-plugin/tree/master/packages/no-autofix)
