import eslint from 'eslint';
import fs from 'node:fs';
import path from 'node:path';

import getNonFixableRule from './utils';

const linter = new eslint.Linter();
export const allRules: { [key: string]: eslint.Rule.RuleModule } = {};
const builtIns: { [key: string]: NodeModule } = {};
const importedBuiltIns: Promise<NodeModule>[] = [];

const getBuiltin = fs
  .readdirSync(path.join(path.resolve(), '../../eslint/lib/rules'))
  .filter((it) => it.includes('.js'));

for (const builtIn of getBuiltin) {
  importedBuiltIns.push(
    import(
      path.join(path.resolve(), '../../eslint/lib/rules/', builtIn)
    ) as Promise<NodeModule>,
  );
}

for (const rule of await Promise.all(importedBuiltIns)) {
  builtIns[rule.id as keyof typeof builtIns] = rule;
}

for (const current of Object.keys(builtIns)) {
  const rule = linter.getRules().get(current);
  if (rule) {
    allRules[current as keyof typeof allRules] = getNonFixableRule(rule);
  }
}

const getPlugins = fs
  .readdirSync(path.join(path.resolve(), '../../'))
  .filter(
    (it) =>
      (it.startsWith('eslint-plugin') ||
        (it.startsWith('@') && /eslint/u.test(it))) &&
      it !== 'eslint-plugin-disable-autofix' &&
      it !== '@eslint',
  );

const importedPlugins: Promise<NodeModule>[] = [];

for (const plugin of getPlugins) {
  let copyIt = plugin;
  if (plugin.includes('@')) {
    const pluginDirectory = fs
      .readdirSync(path.join(path.resolve(), '../../', plugin))
      .find((read) => /plugin/u.test(read));
    if (pluginDirectory) {
      copyIt = path.join(path.resolve(), '../../', plugin, pluginDirectory);
    }
  }
  importedPlugins.push(import(copyIt) as Promise<NodeModule>);
}

for (const plugin of await Promise.all(importedPlugins)) {
  const pluginName = plugin.id.includes('@')
    ? plugin.id.split('/')[0]
    : plugin.id.replace(/^eslint-plugin-/u, '');
  for (const rule of Object.keys(plugin.rules || {})) {
    if (rule) {
      allRules[`${pluginName}/${rule}` as keyof typeof allRules] =
        getNonFixableRule(plugin.rules[rule as keyof typeof plugin.rules]);
    }
  }
}

const PLUGIN_NAME = 'disable-autofix';

export const all = {
  plugins: [PLUGIN_NAME],
  allRules: {},
};

for (const rule of Object.keys(allRules)) {
  Object.assign(all.allRules, { [`${PLUGIN_NAME}/${rule}`]: 'error' });
}
