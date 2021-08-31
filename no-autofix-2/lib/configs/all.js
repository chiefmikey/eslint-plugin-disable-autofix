import allRules from '../rules';

const PLUGIN_NAME = 'no-autofix-2';

const all = {
  plugins: [PLUGIN_NAME],
  rules: {},
};

// turn on plugin rules
Object.keys(allRules).reduce(
  (rules, ruleName) =>
    Object.assign(rules, { [`${PLUGIN_NAME}/${ruleName}`]: 'error' }),
  all.rules,
);

export default all;
