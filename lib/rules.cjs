const fs = require('fs');
const path = require('path');
const eslint = require('eslint');
const { getNonFixableRule } = require('./utils.cjs');

const linter = new eslint.Linter();
const rules = {};
const builtInRules = {};

const builtIn = fs
  .readdirSync(path.join(__dirname, '../../eslint/lib/rules'))
  .filter((it) => it.includes('.js'));

for (let i = 0; i < builtIn.length; i += 1) {
  const importedRule = require(path.join(
    __dirname,
    '../../eslint/lib/rules/',
    builtIn[i],
  ));
  builtInRules[builtIn[i]] = importedRule;
}

Object.keys(builtInRules).reduce((acc, cur) => {
  const rule = linter.getRules().get(cur);
  if (rule) {
    acc[cur] = getNonFixableRule(rule);
  }
  return acc;
}, rules);

const plugins = fs
  .readdirSync(path.join(__dirname, '../../'))
  .filter(
    (it) =>
      (/^eslint-plugin/u.test(it) || (/^@/u.test(it) && /eslint/u.test(it))) &&
      it !== 'eslint-plugin-disable-autofix' &&
      it !== '@eslint',
  );

plugins.forEach((it) => {
  let copyIt = it;
  let pluginName;
  if (it.includes('@')) {
    [pluginName] = it.split('/');
    const pluginDirectory = fs
      .readdirSync(path.join(__dirname, '../../', it))
      .filter((read) => /plugin/u.test(read));
    copyIt = path.join(__dirname, '../../', it, pluginDirectory[0]);
  } else {
    pluginName = it.replace(/^eslint-plugin-/u, '');
  }
  const plugin = require(copyIt);

  Object.keys(plugin.rules || {}).forEach((rule) => {
    if (rule) {
      rules[`${pluginName}/${rule}`] = getNonFixableRule(plugin.rules[rule]);
    }
  });
});

const PLUGIN_NAME = 'disable-autofix';

const all = {
  plugins: [PLUGIN_NAME],
  rules: {},
};

Object.keys(rules).reduce(
  (theRules, ruleName) =>
    Object.assign(theRules, { [`${PLUGIN_NAME}/${ruleName}`]: 'error' }),
  all.rules,
);

module.exports = { all, rules };
