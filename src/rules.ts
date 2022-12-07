import fs from 'node:fs';
import path from 'node:path';

import eslint from 'eslint';
import appRoot from 'app-root-path';

import getNonFixableRule from './utils';

interface EslintPlugin {
  rules: { [key: string]: eslint.Rule.RuleModule };
  id: string;
}

const linter = new eslint.Linter();
export const rules: { [key: string]: eslint.Rule.RuleModule } = {};
const builtIns: { [key: string]: NodeModule } = {};

const importedPlugins: EslintPlugin[] = [];
const dirname = appRoot.toString();

const nodeModules = 'node_modules/';

const getBuiltIn = fs
  .readdirSync(path.join(dirname, nodeModules, 'eslint/lib/rules'))
  .filter((builtIn) => builtIn.includes('.js'));

for (const builtIn of getBuiltIn) {
  const builtInRule = require(path.join(
    dirname,
    nodeModules,
    'eslint/lib/rules/',
    builtIn,
  )) as NodeModule;
  builtIns[builtIn] = builtInRule;
}

for (const current of Object.keys(builtIns)) {
  const rule = linter.getRules().get(current);
  if (rule) {
    rules[current as keyof typeof rules] = getNonFixableRule(rule);
  }
}

const getPlugins = fs
  .readdirSync(path.join(dirname, nodeModules))
  .filter(
    (plugin) =>
      (plugin.startsWith('eslint-plugin') ||
        (plugin.startsWith('@') && /eslint/u.test(plugin))) &&
      plugin !== 'eslint-plugin-disable-autofix' &&
      plugin !== '@eslint',
  );

for (const plugin of getPlugins) {
  if (plugin.includes('@')) {
    const pluginDirectories = fs
      .readdirSync(path.join(dirname, nodeModules, plugin))
      .filter((read) => /plugin/u.test(read));
    pluginDirectories.forEach((pluginDirectory) => {
      const scopedPlugin = path.join(
        dirname,
        nodeModules,
        plugin,
        pluginDirectory,
      );
      const imported = require(scopedPlugin) as EslintPlugin;
      imported.id = scopedPlugin.replace(path.join(dirname, nodeModules), '');
      importedPlugins.push(imported);
    });
  } else {
    const imported = require(plugin) as EslintPlugin;
    imported.id = plugin;
    importedPlugins.push(imported);
  }
}

for (const plugin of importedPlugins) {
  const pluginRules = plugin.rules;
  const pluginId = plugin.id;
  if (pluginId) {
    const pluginName = pluginId.includes('@')
      ? // convert `@angular-eslint/eslint-plugin` -> `@angular-eslint` and `@angular-eslint/eslint-plugin-template` -> `@angular-eslint/template`
        pluginId.replace(/eslint-plugin(-|)/u, '').replace(/\/$/, '')
      : pluginId.replace(/^eslint-plugin-/u, '');
    for (const rule of Object.keys(pluginRules || {})) {
      if (rule) {
        rules[`${pluginName}/${rule}` as keyof typeof rules] =
          getNonFixableRule(pluginRules[rule as keyof typeof pluginRules]);
      }
    }
  }
}

const PLUGIN_NAME = 'disable-autofix';
export const configs = {
  all: {
    plugins: [PLUGIN_NAME],
    rules: {},
  },
};
for (const rule of Object.keys(rules)) {
  Object.assign(configs.all.rules, { [`${PLUGIN_NAME}/${rule}`]: 'error' });
}
