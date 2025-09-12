declare module 'eslint-rule-composer';
declare module '@babel/eslint-plugin';
declare module 'eslint-plugin-disable-autofix';
declare module 'eslint/lib/rules/*';

import type { Rule, AST, SourceCode } from 'eslint';

export interface EslintPlugin {
  rules: Record<string, Rule.RuleModule>;
  id: string;
}

export interface Problem {
  message: string;
  messageId: string | undefined;
  data: object | undefined;
  loc: AST.SourceLocation;
  fix: undefined;
}

export interface Metadata {
  sourceCode: SourceCode;
  settings?: object;
  filename: string;
}

export interface DisableAutofixPlugin {
  meta: {
    name: string;
    version: string;
  };
  configs: {
    recommended: {
      plugins: string[];
    };
  };
  rules: Record<string, Rule.RuleModule>;
  processors: Record<string, unknown>;
  flatConfig: {
    plugins: {
      'disable-autofix': {
        rules: Record<string, Rule.RuleModule>;
      };
    };
  };
}

declare const plugin: DisableAutofixPlugin;
export default plugin;
