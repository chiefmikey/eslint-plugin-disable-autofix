import eslint from 'eslint';
import ruleComposer from 'eslint-rule-composer';

const map: MapReports = ruleComposer.mapReports;

const getNonFixableRule = (rule: eslint.Rule.RuleModule) => {
  return map(Object.create(rule), (problem) => ((problem.fix = null), problem));
};

export default getNonFixableRule;
