/* eslint-disable no-param-reassign */
import eslint from 'eslint';
import ruleComposer from 'eslint-rule-composer';

const map = (ruleComposer as { mapReports: MapReports }).mapReports;

const getNonFixableRule = (rule: eslint.Rule.RuleModule) => {
  return map(rule, (problem) => {
    problem.fix = undefined;
    return problem;
  });
};

export default getNonFixableRule;
