import fs from 'node:fs';
import path from 'node:path';

import eslint from 'eslint';

import getNonFixableRule from './utils';

const linter = new eslint.Linter();
export const allRules: { [key: string]: eslint.Rule.RuleModule } = {};
const builtIns: { [key: string]: NodeModule } = {};
const importedBuiltIns: Promise<NodeModule>[] = [];
const dirname = path.resolve();

const getBuiltIn = fs
  .readdirSync(path.join(dirname, 'node_modules/eslint/lib/rules'))
  .filter((builtIn) => builtIn.includes('.js'));

  for (const builtIn of getBuiltIn) {
    const builtInRule =
      require(
        path.join(dirname, 'node_modules/eslint/lib/rules/', builtIn)
      );
builtIns[builtIn] = builtInRule;
  }

  // for (const rule of importedBuiltIns) {
  //   builtIns[rule.id as keyof typeof builtIns] = rule;
  // }

for (const current of Object.keys(builtIns)) {
  const rule = linter.getRules().get(current);
  if (rule) {
    allRules[current as keyof typeof allRules] = getNonFixableRule(rule);
  }
}

const getPlugins = fs
  .readdirSync(path.join(dirname, 'node_modules/'))
  .filter(
    (plugin) =>
      (plugin.startsWith('eslint-plugin') ||
        (plugin.startsWith('@') && /eslint/u.test(plugin))) &&
      plugin !== 'eslint-plugin-disable-autofix' &&
      plugin !== '@eslint',
  );

const importedPlugins: Promise<NodeModule>[] = [];

  for (const plugin of getPlugins) {
    let copyIt = plugin;
    if (plugin.includes('@')) {
      const pluginDirectory = fs
        .readdirSync(path.join(dirname, 'node_modules/', plugin))
        .find((read) => /plugin/u.test(read));
      if (pluginDirectory) {
        copyIt = path.join(dirname, 'node_modules/', plugin, pluginDirectory);
      }
    }
    const imported = require(copyIt);
    imported.id = plugin;
    importedPlugins.push(imported);
  }



  for (const plugin of importedPlugins) {
    const pluginId = plugin.id;
    if (pluginId) {
      const pluginName = pluginId.includes('@')
        ? pluginId.split('/')[0]
        : pluginId.replace(/^eslint-plugin-/u, '');
      for (const rule of Object.keys(plugin.rules || {})) {
        if (rule) {
          allRules[`${pluginName}/${rule}` as keyof typeof allRules] =
            getNonFixableRule(plugin.rules[rule as keyof typeof plugin.rules]);
        }
      }
    }
  }




  const PLUGIN_NAME = 'disable-autofix';
  export const all = {
  plugins: [PLUGIN_NAME],
  rules: {},
};
for (const rule of Object.keys(allRules)) {
  Object.assign(all.rules, { [`${PLUGIN_NAME}/${rule}`]: 'error' });
}



