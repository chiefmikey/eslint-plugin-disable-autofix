import ruleComposer from 'eslint-rule-composer';

export default (rule) => {
  return ruleComposer.mapReports(
    Object.create(rule),
    (problem) => ((problem.fix = null), problem),
  );
};
