declare module 'eslint-rule-composer' {
  import type { Rule } from 'eslint';

  export function mapReports(
    rule: Rule.RuleModule,
    iteratee: (problem: any) => any,
  ): Rule.RuleModule;
}

declare module 'app-root-path' {
  const appRoot: {
    toString(): string;
    path: string;
  };
  export = appRoot;
}
