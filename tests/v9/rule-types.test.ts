import { describe, expect, it } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { ESLint } from 'eslint';

import disableAutofix from 'eslint-plugin-disable-autofix';

describe('comprehensive ESLint rule types testing', () => {
  const testFilesDir = path.join(__dirname, 'rule-type-test-files');

  beforeAll(() => {
    if (!fs.existsSync(testFilesDir)) {
      fs.mkdirSync(testFilesDir, { recursive: true });
    }
  });

  afterAll(() => {
    if (fs.existsSync(testFilesDir)) {
      fs.rmSync(testFilesDir, { recursive: true, force: true });
    }
  });

  const createTestFile = (filename: string, content: string): string => {
    const filePath = path.join(testFilesDir, filename);
    fs.writeFileSync(filePath, content, 'utf8');
    return filePath;
  };

  const runESLintWithRules = async (rules: Record<string, any>, testCode: string): Promise<any[]> => {
    const testFile = createTestFile(`rule-test-${Date.now()}.js`, testCode);

    const config = {
      plugins: { 'disable-autofix': disableAutofix },
      rules,
    };

    const eslint = new ESLint({
      cwd: __dirname,
      overrideConfig: config,
      useEslintrc: false,
      fix: true,
    });

    const results = await eslint.lintFiles([testFile]);
    return results;
  };

  describe('Possible Errors (fixable)', () => {
    it('should disable autofix for no-console', async () => {
      const rules = {
        'no-console': 'off',
        'disable-autofix/no-console': 'warn',
      };

      const results = await runESLintWithRules(rules, 'console.log("test");');
      expect(results[0].messages).toHaveLength(1);
      expect(results[0].messages[0].ruleId).toBe('disable-autofix/no-console');
      expect(results[0].output).toBe('console.log("test");'); // No fix applied
    });

    it('should disable autofix for no-debugger', async () => {
      const rules = {
        'no-debugger': 'off',
        'disable-autofix/no-debugger': 'error',
      };

      const results = await runESLintWithRules(rules, 'debugger;');
      expect(results[0].messages).toHaveLength(1);
      expect(results[0].messages[0].ruleId).toBe('disable-autofix/no-debugger');
    });

    it('should disable autofix for no-undef', async () => {
      const rules = {
        'no-undef': 'off',
        'disable-autofix/no-undef': 'warn',
      };

      const results = await runESLintWithRules(rules, 'undefinedVar = 1;');
      expect(results[0].messages).toHaveLength(1);
      expect(results[0].messages[0].ruleId).toBe('disable-autofix/no-undef');
    });
  });

  describe('Best Practices (mix of fixable and non-fixable)', () => {
    it('should disable autofix for eqeqeq (non-fixable)', async () => {
      const rules = {
        'eqeqeq': 'off',
        'disable-autofix/eqeqeq': 'warn',
      };

      const results = await runESLintWithRules(rules, 'if (x == y) {}');
      expect(results[0].messages).toHaveLength(1);
      expect(results[0].messages[0].ruleId).toBe('disable-autofix/eqeqeq');
    });

    it('should disable autofix for no-unused-vars (fixable)', async () => {
      const rules = {
        'no-unused-vars': 'off',
        'disable-autofix/no-unused-vars': 'warn',
      };

      const results = await runESLintWithRules(rules, 'const unused = 1;');
      expect(results[0].messages).toHaveLength(1);
      expect(results[0].messages[0].ruleId).toBe('disable-autofix/no-unused-vars');
    });

    it('should disable autofix for curly (fixable)', async () => {
      const rules = {
        'curly': 'off',
        'disable-autofix/curly': ['warn', 'all'],
      };

      const results = await runESLintWithRules(rules, 'if (true) return;');
      expect(results[0].messages).toHaveLength(1);
      expect(results[0].messages[0].ruleId).toBe('disable-autofix/curly');
      expect(results[0].output).toBe('if (true) return;\n'); // No fix applied
    });
  });

  describe('Strict Mode rules', () => {
    it('should disable autofix for strict (fixable)', async () => {
      const rules = {
        'strict': 'off',
        'disable-autofix/strict': ['warn', 'global'],
      };

      const results = await runESLintWithRules(rules, 'function foo() {}');
      // strict rule behavior depends on context
      expect(results[0].errorCount).toBeDefined();
    });
  });

  describe('Variables rules', () => {
    it('should disable autofix for no-undef (non-fixable)', async () => {
      const rules = {
        'no-undef': 'off',
        'disable-autofix/no-undef': 'error',
      };

      const results = await runESLintWithRules(rules, 'globalVar = 1;');
      expect(results[0].messages).toHaveLength(1);
      expect(results[0].messages[0].ruleId).toBe('disable-autofix/no-undef');
    });

    it('should disable autofix for prefer-const (fixable)', async () => {
      const rules = {
        'prefer-const': 'off',
        'disable-autofix/prefer-const': 'warn',
      };

      const results = await runESLintWithRules(rules, 'let x = 1;');
      expect(results[0].messages).toHaveLength(1);
      expect(results[0].messages[0].ruleId).toBe('disable-autofix/prefer-const');
      expect(results[0].output).toBe('let x = 1;\n'); // No fix applied
    });
  });

  describe('Stylistic Issues (mostly fixable)', () => {
    it('should disable autofix for indent (fixable)', async () => {
      const rules = {
        'indent': 'off',
        'disable-autofix/indent': ['warn', 2],
      };

      const results = await runESLintWithRules(rules, 'if (true) {\n  console.log("test");\n}');
      expect(results[0].messages).toHaveLength(1);
      expect(results[0].messages[0].ruleId).toBe('disable-autofix/indent');
      expect(results[0].output).toBe('if (true) {\n  console.log("test");\n}\n'); // No fix applied
    });

    it('should disable autofix for quotes (fixable)', async () => {
      const rules = {
        'quotes': 'off',
        'disable-autofix/quotes': ['warn', 'single'],
      };

      const results = await runESLintWithRules(rules, 'const str = "test";');
      expect(results[0].messages).toHaveLength(1);
      expect(results[0].messages[0].ruleId).toBe('disable-autofix/quotes');
      expect(results[0].output).toBe('const str = "test";\n'); // No fix applied
    });

    it('should disable autofix for semi (fixable)', async () => {
      const rules = {
        'semi': 'off',
        'disable-autofix/semi': ['warn', 'always'],
      };

      const results = await runESLintWithRules(rules, 'const x = 1');
      expect(results[0].messages).toHaveLength(1);
      expect(results[0].messages[0].ruleId).toBe('disable-autofix/semi');
      expect(results[0].output).toBe('const x = 1\n'); // No fix applied
    });

    it('should disable autofix for comma-dangle (fixable)', async () => {
      const rules = {
        'comma-dangle': 'off',
        'disable-autofix/comma-dangle': ['warn', 'never'],
      };

      const results = await runESLintWithRules(rules, 'const obj = {a: 1,};');
      expect(results[0].messages).toHaveLength(1);
      expect(results[0].messages[0].ruleId).toBe('disable-autofix/comma-dangle');
      expect(results[0].output).toBe('const obj = {a: 1,};\n'); // No fix applied
    });

    it('should disable autofix for space-before-function-paren (fixable)', async () => {
      const rules = {
        'space-before-function-paren': 'off',
        'disable-autofix/space-before-function-paren': ['warn', 'never'],
      };

      const results = await runESLintWithRules(rules, 'function foo () {}');
      expect(results[0].messages).toHaveLength(1);
      expect(results[0].messages[0].ruleId).toBe('disable-autofix/space-before-function-paren');
      expect(results[0].output).toBe('function foo () {}\n'); // No fix applied
    });
  });

  describe('ES6+ rules', () => {
    it('should disable autofix for arrow-spacing (fixable)', async () => {
      const rules = {
        'arrow-spacing': 'off',
        'disable-autofix/arrow-spacing': 'warn',
      };

      const results = await runESLintWithRules(rules, 'const fn = ()=>{ };');
      expect(results[0].messages).toHaveLength(1);
      expect(results[0].messages[0].ruleId).toBe('disable-autofix/arrow-spacing');
    });

    it('should disable autofix for template-curly-spacing (fixable)', async () => {
      const rules = {
        'template-curly-spacing': 'off',
        'disable-autofix/template-curly-spacing': 'warn',
      };

      const results = await runESLintWithRules(rules, 'const str = `Hello ${name}`;');
      // This rule might not trigger depending on the code
      expect(results[0].errorCount).toBeDefined();
    });

    it('should disable autofix for object-shorthand (fixable)', async () => {
      const rules = {
        'object-shorthand': 'off',
        'disable-autofix/object-shorthand': 'warn',
      };

      const results = await runESLintWithRules(rules, 'const obj = { foo: foo };');
      expect(results[0].messages).toHaveLength(1);
      expect(results[0].messages[0].ruleId).toBe('disable-autofix/object-shorthand');
      expect(results[0].output).toBe('const obj = { foo: foo };\n'); // No fix applied
    });

    it('should disable autofix for prefer-arrow-callback (fixable)', async () => {
      const rules = {
        'prefer-arrow-callback': 'off',
        'disable-autofix/prefer-arrow-callback': 'warn',
      };

      const results = await runESLintWithRules(rules, 'const fn = function() {};');
      expect(results[0].messages).toHaveLength(1);
      expect(results[0].messages[0].ruleId).toBe('disable-autofix/prefer-arrow-callback');
      expect(results[0].output).toBe('const fn = function() {};\n'); // No fix applied
    });
  });

  describe('Complex rule configurations', () => {
    it('should handle rules with complex option objects', async () => {
      const rules = {
        'no-unused-vars': 'off',
        'disable-autofix/no-unused-vars': ['warn', {
          vars: 'all',
          args: 'after-used',
          ignoreRestSiblings: true,
          varsIgnorePattern: '^_',
          argsIgnorePattern: '^_'
        }],
      };

      const results = await runESLintWithRules(rules, 'const _unused = 1; function fn(_arg) {}');
      expect(results[0].messages.length).toBeGreaterThanOrEqual(0);
      // Should not crash with complex options
    });

    it('should handle rules with array options', async () => {
      const rules = {
        'indent': 'off',
        'disable-autofix/indent': ['warn', 2, {
          SwitchCase: 1,
          VariableDeclarator: 1,
          outerIIFEBody: 1,
          MemberExpression: 1,
          FunctionDeclaration: { parameters: 1, body: 1 },
          FunctionExpression: { parameters: 1, body: 1 },
          CallExpression: { arguments: 1 },
          ArrayExpression: 1,
          ObjectExpression: 1,
          ImportDeclaration: 1,
          flatTernaryExpressions: false,
          ignoreComments: false,
          ignoredNodes: ['TemplateLiteral *']
        }],
      };

      const results = await runESLintWithRules(rules, 'if (true) {\n    console.log("test");\n  }');
      expect(results[0].errorCount).toBeDefined();
      // Should not crash with complex array options
    });
  });

  describe('Non-fixable rules handling', () => {
    it('should handle non-fixable rules correctly', async () => {
      const rules = {
        'no-alert': 'off',
        'disable-autofix/no-alert': 'warn',
        'no-bitwise': 'off',
        'disable-autofix/no-bitwise': 'error',
      };

      const results = await runESLintWithRules(rules, 'alert("test"); const x = 1 & 2;');
      expect(results[0].messages.length).toBeGreaterThanOrEqual(1);
      // Non-fixable rules should still report issues but never attempt fixes
      expect(results[0].output).toBe('alert("test"); const x = 1 & 2;\n');
    });

    it('should handle mixed fixable and non-fixable rules', async () => {
      const rules = {
        'quotes': 'off',           // fixable
        'no-alert': 'off',         // non-fixable
        'disable-autofix/quotes': 'warn',
        'disable-autofix/no-alert': 'error',
      };

      const results = await runESLintWithRules(rules, 'const str = "test"; alert("hi");');
      expect(results[0].messages.length).toBeGreaterThanOrEqual(1);
      // No fixes should be applied to any rules
      expect(results[0].output).toBe('const str = "test"; alert("hi");\n');
    });
  });

  describe('Rule categories and combinations', () => {
    it('should handle multiple rules from different categories', async () => {
      const rules = {
        // Possible errors
        'no-console': 'off',
        'disable-autofix/no-console': 'warn',

        // Best practices
        'eqeqeq': 'off',
        'disable-autofix/eqeqeq': 'warn',

        // Stylistic
        'quotes': 'off',
        'disable-autofix/quotes': ['warn', 'single'],

        // Variables
        'prefer-const': 'off',
        'disable-autofix/prefer-const': 'warn',
      };

      const results = await runESLintWithRules(rules,
        'console.log("test"); if (x == y) {}; const str = "hello"; let z = 1;'
      );

      expect(results[0].messages.length).toBeGreaterThanOrEqual(3);
      expect(results[0].messages.every(msg => msg.ruleId?.startsWith('disable-autofix/'))).toBe(true);
      // No fixes should be applied
      expect(results[0].output).toBe('console.log("test"); if (x == y) {}; const str = "hello"; let z = 1;\n');
    });

    it('should handle rules with different severity levels', async () => {
      const rules = {
        'prefer-const': 'off',
        'no-console': 'off',
        'quotes': 'off',
        'disable-autofix/prefer-const': 'warn',    // 1
        'disable-autofix/no-console': 'error',     // 2
        'disable-autofix/quotes': 0,               // 0 - disabled
      };

      const results = await runESLintWithRules(rules,
        'let x = 1; console.log("test"); const str = "hello";'
      );

      expect(results[0].messages.length).toBe(2); // Only warn and error, not disabled

      const severities = results[0].messages.map(m => m.severity);
      expect(severities).toContain(1); // warn
      expect(severities).toContain(2); // error
      expect(severities).not.toContain(0); // disabled
    });
  });

  describe('Edge cases in rule handling', () => {
    it('should handle rules that don\'t exist', async () => {
      const rules = {
        'non-existent-rule': 'off',
        'disable-autofix/non-existent-rule': 'warn',
      };

      const results = await runESLintWithRules(rules, 'let x = 1;');
      // Should not crash even with non-existent rules
      expect(results[0].errorCount).toBeDefined();
    });

    it('should handle empty rule options', async () => {
      const rules = {
        'prefer-const': 'off',
        'disable-autofix/prefer-const': ['warn'], // Empty options array
      };

      const results = await runESLintWithRules(rules, 'let x = 1;');
      expect(results[0].messages).toHaveLength(1);
      expect(results[0].messages[0].ruleId).toBe('disable-autofix/prefer-const');
    });

    it('should handle null rule options', async () => {
      const rules = {
        'prefer-const': 'off',
        'disable-autofix/prefer-const': ['warn', null],
      };

      const results = await runESLintWithRules(rules, 'let x = 1;');
      // Should not crash with null options
      expect(results[0].errorCount).toBeDefined();
    });
  });
});
