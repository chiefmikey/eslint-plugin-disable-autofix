declare module 'eslint-rule-composer';

interface Problem {
  message: string;
  messageId: string | null;
  data: object | null;
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
