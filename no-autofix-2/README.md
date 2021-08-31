# No Autofix 2

Disable ESLint autofix (--fix) for specified rules

WIP

<!--
## Why

[Some warnings is auto-fixable but we do not want to fix it, like "prefer-const" .](https://github.com/Microsoft/vscode-eslint/issues/208)

## Install & usage

```bash
$ npm i eslint-plugin-no-autofix -D # for npm
$ yarn add eslint-plugin-no-autofix -D # for yarn
```

add prefix "no-autofix/" to the rulename in eslintrc:

```js
{
  "plugins": ["no-autofix"],
  "rules": {
    "prefer-const": "off",
    "no-autofix/prefer-const": "error",
  }
}
```

or a 3rd-party plugin:

```js
{
  "plugins": ["no-autofix", "react"],
  "rules": {
    "react/jsx-indent": "off",
    "no-autofix/react/jsx-indent": "error",
  }
}
```

## Supported rules

It supports [all eslint core rules](https://eslint.org/docs/rules/) and
3rd-party plugins(except for scoped packages).

## Acknowledgement

- [ESLint](https://eslint.org)
- [eslint-rule-composer](https://github.com/not-an-aardvark/eslint-rule-composer)
  -->
