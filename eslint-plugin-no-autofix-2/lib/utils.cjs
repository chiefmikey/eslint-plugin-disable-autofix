const ruleComposer = require('eslint-rule-composer');

exports.getNonFixableRule = function (rule) {
  return ruleComposer.mapReports(
    Object.create(rule),
    (problem) => ((problem.fix = null), problem),
  );
};
