declare module 'eslint-rule-composer';
declare module 'eslint-plugin-unicorn';
declare module '@babel/eslint-plugin';
declare module 'eslint-plugin-disable-autofix';
declare module 'eslint/lib/rules/*';

// Enhanced type definitions for better type safety
declare module 'eslint' {
  namespace Rule {
    interface RuleModule {
      meta?: {
        type?: 'problem' | 'suggestion' | 'layout';
        docs?: {
          description?: string;
          category?: string;
          recommended?: boolean;
          url?: string;
        };
        fixable?: 'code' | 'whitespace' | null;
        schema?: any[];
        messages?: Record<string, string>;
        deprecated?: boolean;
        replacedBy?: string[];
      };
      create: (context: RuleContext) => RuleListener;
    }

    interface RuleContext {
      id: string;
      options: any[];
      settings: object;
      parserOptions: object;
      parserPath: string;
      filename: string;
      cwd: string;
      sourceCode: SourceCode;
      report: (descriptor: ReportDescriptor) => void;
    }

    interface ReportDescriptor {
      message: string;
      messageId?: string;
      data?: object;
      node?: any;
      loc?: SourceLocation | { start: number; end: number };
      fix?: RuleFix | ((fixer: RuleFixer) => RuleFix | RuleFix[] | null);
    }

    interface RuleFixer {
      insertTextAfter(nodeOrToken: any, text: string): RuleFix;
      insertTextAfterRange(range: [number, number], text: string): RuleFix;
      insertTextBefore(nodeOrToken: any, text: string): RuleFix;
      insertTextBeforeRange(range: [number, number], text: string): RuleFix;
      remove(nodeOrToken: any): RuleFix;
      removeRange(range: [number, number]): RuleFix;
      replaceText(nodeOrToken: any, text: string): RuleFix;
      replaceTextRange(range: [number, number], text: string): RuleFix;
    }

    interface RuleFix {
      range: [number, number];
      text: string;
    }

    interface RuleListener {
      [key: string]: (node: any) => void;
    }
  }

  interface SourceLocation {
    line: number;
    column: number;
  }

  interface SourceCode {
    text: string;
    ast: any;
    lines: string[];
    getText(node?: any, beforeCount?: number, afterCount?: number): string;
    getLines(): string[];
    getAllComments(): any[];
    getComments(node: any): { leading: any[]; trailing: any[] };
    getJSDocComment(node: any): any;
    getNodeByRangeIndex(index: number): any;
    getTokenAfter(node: any, options?: any): any;
    getTokenBefore(node: any, options?: any): any;
    getTokenByRangeStart(offset: number, options?: any): any;
    getTokens(node?: any, options?: any): any[];
    getTokensAfter(node: any, options?: any): any[];
    getTokensBefore(node: any, options?: any): any[];
    commentsExistBetween(left: any, right: any): boolean;
    getCommentsBefore(node: any): any[];
    getCommentsAfter(node: any): any[];
    getCommentsInside(node: any): any[];
  }
}
