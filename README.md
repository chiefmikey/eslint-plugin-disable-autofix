# eslint-plugin-disable-autofix

Disable ESLint autofix (--fix) for specified rules and prevent them from being
formatted without turning them off

_Useful when two different rules have the same solution resulting in duplicate
formatting_

## Usage

### Install

```shell
npm i -D eslint-plugin-disable-autofix
```

### Configure

Add prefix `disable-autofix/` to the rule name in eslintrc and disable the
original

```js
module.exports = {
  plugins: ['disable-autofix'],
  rules: {
    'prefer-const': 'off',
    'disable-autofix/prefer-const': 'error',
  },
};
```

Use 3rd-party plugins

```js
module.exports = {
  plugins: ['disable-autofix', 'react'],
  rules: {
    'react/jsx-indent': 'off',
    'disable-autofix/react/jsx-indent': 'error',
  },
};
```

Use scoped plugins

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

## Resources

- [ESLint](https://eslint.org)
- [eslint-rule-composer](https://github.com/not-an-aardvark/eslint-rule-composer)
- [eslint-plugin-no-autofix](https://github.com/aladdin-add/eslint-plugin/tree/master/packages/no-autofix)
