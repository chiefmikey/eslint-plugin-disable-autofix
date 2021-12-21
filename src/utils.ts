/* eslint-disable no-param-reassign */
import eslint from 'eslint';
import ruleComposer from 'eslint-rule-composer';

interface Problem {
  message: string;
  messageId: string | undefined;
  data: object | undefined;
  loc: eslint.AST.SourceLocation;
  fix: undefined;
}

interface Metadata {
  sourceCode: eslint.SourceCode;
  settings?: object;
  filename: string;
}

interface Predicate<T> {
  (problem: Problem, metadata: Metadata): T;
}

type MapReports = (
  rule: eslint.Rule.RuleModule,
  iteratee: Predicate<Problem>,
) => eslint.Rule.RuleModule;

const map = (ruleComposer as { mapReports: MapReports }).mapReports;

const getNonFixableRule = (rule: eslint.Rule.RuleModule) => {
  return map(rule, (problem) => {
    problem.fix = undefined;
    return problem;
  });
};

export default getNonFixableRule;
