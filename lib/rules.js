import fs from 'node:fs';
import path from 'node:path';
import eslint from 'eslint';
import getNonFixableRule from './utils';
const linter = new eslint.Linter();
export const allRules = {};
const builtIns = {};
const importedBuiltIns = [];
const getBuiltIn = fs
    .readdirSync(path.join(path.resolve(), '../../eslint/lib/rules'))
    .filter((builtIn) => builtIn.includes('.js'));
for (const builtIn of getBuiltIn) {
    importedBuiltIns.push(import(path.join(path.resolve(), '../../eslint/lib/rules/', builtIn)));
}
for (const rule of await Promise.all(importedBuiltIns)) {
    builtIns[rule.id] = rule;
}
for (const current of Object.keys(builtIns)) {
    const rule = linter.getRules().get(current);
    if (rule) {
        allRules[current] = getNonFixableRule(rule);
    }
}
const getPlugins = fs
    .readdirSync(path.join(path.resolve(), '../../'))
    .filter((plugin) => (plugin.startsWith('eslint-plugin') ||
    (plugin.startsWith('@') && /eslint/u.test(plugin))) &&
    plugin !== 'eslint-plugin-disable-autofix' &&
    plugin !== '@eslint');
const importedPlugins = [];
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
    importedPlugins.push(import(copyIt));
}
for (const plugin of await Promise.all(importedPlugins)) {
    console.log(plugin);
    const pluginName = plugin.id.includes('@')
        ? plugin.id.split('/')[0]
        : plugin.id.replace(/^eslint-plugin-/u, '');
    for (const rule of Object.keys(plugin.rules || {})) {
        if (rule) {
            allRules[`${pluginName}/${rule}`] =
                getNonFixableRule(plugin.rules[rule]);
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
