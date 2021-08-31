import fs from 'fs';
import path from 'path';
import eslint from 'eslint';
import getNonFixableRule from './utils';

const __dirname = import.meta.url.slice(7, import.meta.url.lastIndexOf('/'));

const linter = new eslint.Linter();
const allRules = {};
const builtInRules = {};

const builtIn = fs
  .readdirSync(path.join(__dirname, 'eslint/lib/rules'))
  .filter((it) => it.includes('.js'));

for (let i = 0; i < builtIn.length; i += 1) {
  const loadRule = async () => {
    const importedRule = await import(builtIn[i]);
    builtInRules[builtIn[i]] = importedRule;
  };
  loadRule();
}

path.join(__dirname, 'eslint/lib/rules');

Object.keys(builtInRules).reduce((acc, cur) => {
  const rule = linter.getRules().get(cur);
  acc[cur] = getNonFixableRule(rule);
  return acc;
}, allRules);

const plugins = fs
  .readdirSync(path.join(__dirname, 'node_modules'))
  .filter((it) => /^eslint/u.test(it) && it !== 'eslint-plugin-no-autofix-2');

plugins.forEach(async (it) => {
  let pluginName;
  const plugin = await import(it);
  if (it.includes('@')) {
    [pluginName] = it.split('/');
  } else {
    pluginName = it.replace(/^eslint-plugin-/u, '');
  }

  Object.keys(plugin.rules || {}).forEach((rule) => {
    allRules[`${pluginName}/${rule}`] = getNonFixableRule(plugin.rules[rule]);
  });
});

export default allRules;
