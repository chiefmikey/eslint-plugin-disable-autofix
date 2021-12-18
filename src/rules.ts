import eslint from 'eslint';
import fs from 'node:fs';
import path from 'node:path';

import getNonFixableRule from './utils';

const linter = new eslint.Linter();
export const rules = {};
const builtInRules: { property?: NodeModule } = {};
const promises: Promise<NodeModule>[] = [];

const builtIn = fs
  .readdirSync(path.join(path.resolve(), '../../eslint/lib/rules'))
  .filter((it) => it.includes('.js'));

for (const element of builtIn) {
  promises.push(
    import(
      path.join(path.resolve(), '../../eslint/lib/rules/', element)
    ) as Promise<NodeModule>,
  );
}

for (const rule of await Promise.all(promises)) {
  builtInRules[rule.id as keyof typeof builtInRules] = rule;
}

Object.keys(builtInRules).reduce((accumulator, current) => {
  const rule = linter.getRules().get(current);
  if (rule) {
    accumulator[current] = getNonFixableRule(rule);
  }
  return accumulator;
}, rules);

const plugins = fs
  .readdirSync(path.join(path.resolve(), '../../'))
  .filter(
    (it) =>
      (it.startsWith('eslint-plugin') ||
        (it.startsWith('@') && /eslint/u.test(it))) &&
      it !== 'eslint-plugin-disable-autofix' &&
      it !== '@eslint',
  );

const importedPlugins = [];

for (const it of plugins) {
  let copyIt = it;
  let pluginName;
  if (it.includes('@')) {
    [pluginName] = it.split('/');
    const pluginDirectory = fs
      .readdirSync(path.join(path.resolve(), '../../', it))
      .find((read) => /plugin/u.test(read));
    if (pluginDirectory) {
      copyIt = path.join(path.resolve(), '../../', it, pluginDirectory);
    }
  } else {
    pluginName = it.replace(/^eslint-plugin-/u, '');
  }
  importedPlugins.push(import(copyIt));
}

for (const plugin of await Promise.all(importedPlugins)) {
  for (const rule of Object.keys(plugin.rules || {})) {
    if (rule) {
      rules[`${pluginName}/${rule}`] = getNonFixableRule(plugin.rules[rule]);
    }
  }
}

const PLUGIN_NAME = 'disable-autofix';

export const all = {
  plugins: [PLUGIN_NAME],
  rules: {},
};

Object.keys(rules).reduce(
  (theRules, ruleName) =>
    Object.assign(theRules, { [`${PLUGIN_NAME}/${ruleName}`]: 'error' }),
  all.rules,
);
