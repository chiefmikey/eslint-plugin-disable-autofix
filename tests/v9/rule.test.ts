import { describe, expect, it } from '@jest/globals';
import { Linter } from 'eslint';
import type { Rule } from 'eslint';

// The plugin loads rules from node_modules at require time.
// Note: Jest's runtime doesn't support require(esm) like native Node.js,
// so ESM-only plugins (unicorn, @stylistic) may not load in tests.
// Production usage is unaffected — see tests/integration.test.js for
// native Node.js verification of ESM plugin loading.
import disableAutofix from 'eslint-plugin-disable-autofix';

const lint = (text: string, config: Linter.Config): Linter.FixReport => {
  const linter = new Linter();
  return linter.verifyAndFix(text, [config]);
};

const verify = (text: string, config: Linter.Config): Linter.LintMessage[] => {
  const linter = new Linter();
  return linter.verify(text, [config]);
};

const baseConfig = {
  languageOptions: { ecmaVersion: 2024 as const },
};

// ---------------------------------------------------------------------------
// Autofix sanity — prove ESLint fix works before testing our disable
// ---------------------------------------------------------------------------

describe('autofix sanity check', () => {
  it('ESLint fixes prefer-const (builtin rule)', () => {
    const result = lint('let x = 1;', {
      ...baseConfig,
      rules: {
        'prefer-const': 'warn',
        'no-unused-vars': 'off',
        'eol-last': 'off',
      },
    });
    expect(result.fixed).toBe(true);
    expect(result.output).toBe('const x = 1;');
  });
});

// ---------------------------------------------------------------------------
// Core: autofix disabled for builtin rules
// ---------------------------------------------------------------------------

describe('disable autofix — builtin rules', () => {
  it('does not fix prefer-const', () => {
    const input = 'let x = 1;';
    const result = lint(input, {
      ...baseConfig,
      plugins: { 'disable-autofix': disableAutofix },
      rules: {
        'prefer-const': 'off',
        'disable-autofix/prefer-const': 'warn',
        'no-unused-vars': 'off',
        'eol-last': 'off',
      },
    });
    expect(result.fixed).toBe(false);
    expect(result.output).toBe(input);
  });

  it('still reports the violation', () => {
    const messages = verify('let x = 1;', {
      ...baseConfig,
      plugins: { 'disable-autofix': disableAutofix },
      rules: {
        'disable-autofix/prefer-const': 'warn',
        'no-unused-vars': 'off',
        'eol-last': 'off',
      },
    });
    expect(messages.length).toBeGreaterThan(0);
    expect(messages[0].ruleId).toBe('disable-autofix/prefer-const');
  });

  it('does not fix semi', () => {
    const input = 'const x = 1';
    const result = lint(input, {
      ...baseConfig,
      plugins: { 'disable-autofix': disableAutofix },
      rules: {
        'semi': 'off',
        'disable-autofix/semi': ['warn', 'always'],
        'eol-last': 'off',
      },
    });
    expect(result.fixed).toBe(false);
    expect(result.output).toBe(input);
  });

  it('does not fix no-extra-semi', () => {
    const input = 'const x = 1;;';
    const result = lint(input, {
      ...baseConfig,
      plugins: { 'disable-autofix': disableAutofix },
      rules: {
        'no-extra-semi': 'off',
        'disable-autofix/no-extra-semi': 'warn',
        'eol-last': 'off',
      },
    });
    expect(result.fixed).toBe(false);
    expect(result.output).toBe(input);
  });
});

// ---------------------------------------------------------------------------
// Suggestion stripping
// ---------------------------------------------------------------------------

describe('disable suggestions', () => {
  it('original rule reports suggestions', () => {
    const messages = verify('console.log("test")', {
      ...baseConfig,
      rules: { 'no-console': 'warn', 'eol-last': 'off' },
    });
    expect(messages.length).toBeGreaterThan(0);
    expect(messages[0].suggestions).toBeDefined();
    expect(messages[0].suggestions!.length).toBeGreaterThan(0);
  });

  it('disabled rule strips suggestions', () => {
    const messages = verify('console.log("test")', {
      ...baseConfig,
      plugins: { 'disable-autofix': disableAutofix },
      rules: {
        'no-console': 'off',
        'disable-autofix/no-console': 'warn',
        'eol-last': 'off',
      },
    });
    expect(messages.length).toBeGreaterThan(0);
    expect(messages[0].ruleId).toBe('disable-autofix/no-console');
    expect(messages[0].suggestions).toBeUndefined();
  });

  it('rule with both fix+suggestions has correct metadata', () => {
    // no-implicit-coercion has fixable: 'code' AND hasSuggestions: true
    // Verify the original has both properties
    const path = require('path');
    const eslintPkg = require.resolve('eslint/package.json');
    const rulesDir = path.join(path.dirname(eslintPkg), 'lib', 'rules');
    const original = require(path.join(rulesDir, 'no-implicit-coercion.js'));
    expect(original.meta.fixable).toBe('code');
    expect(original.meta.hasSuggestions).toBe(true);
  });

  it('disabled rule with fix+suggestions strips both', () => {
    const input = '"" + x';
    const fixResult = lint(input, {
      ...baseConfig,
      plugins: { 'disable-autofix': disableAutofix },
      rules: {
        'no-implicit-coercion': 'off',
        'disable-autofix/no-implicit-coercion': ['warn', { string: true }],
        'no-undef': 'off',
        'eol-last': 'off',
      },
    });
    expect(fixResult.fixed).toBe(false);
    expect(fixResult.output).toBe(input);

    const messages = verify(input, {
      ...baseConfig,
      plugins: { 'disable-autofix': disableAutofix },
      rules: {
        'no-implicit-coercion': 'off',
        'disable-autofix/no-implicit-coercion': ['warn', { string: true }],
        'no-undef': 'off',
        'eol-last': 'off',
      },
    });
    expect(messages.length).toBeGreaterThan(0);
    expect(messages[0].suggestions).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Metadata stripping
// ---------------------------------------------------------------------------

describe('metadata stripping', () => {
  it('removes fixable from fixable rules', () => {
    expect(disableAutofix.rules['prefer-const'].meta?.fixable).toBeUndefined();
    expect(disableAutofix.rules['semi'].meta?.fixable).toBeUndefined();
    expect(
      disableAutofix.rules['no-extra-semi'].meta?.fixable,
    ).toBeUndefined();
  });

  it('removes hasSuggestions from rules with suggestions', () => {
    expect(
      disableAutofix.rules['no-console'].meta?.hasSuggestions,
    ).toBeUndefined();
    expect(
      disableAutofix.rules['no-prototype-builtins'].meta?.hasSuggestions,
    ).toBeUndefined();
    expect(
      disableAutofix.rules['no-implicit-coercion'].meta?.hasSuggestions,
    ).toBeUndefined();
  });

  it('preserves type, docs, messages, and schema', () => {
    const meta = disableAutofix.rules['prefer-const'].meta;
    expect(meta).toBeDefined();
    expect(meta!.type).toBeDefined();
    expect(meta!.docs).toBeDefined();
    expect(meta!.messages).toBeDefined();
    expect(meta!.schema).toBeDefined();
  });

  it('does not mutate original ESLint rules', () => {
    const path = require('path');
    const eslintPkg = require.resolve('eslint/package.json');
    const rulesDir = path.join(path.dirname(eslintPkg), 'lib', 'rules');
    const original = require(path.join(rulesDir, 'prefer-const.js'));
    expect(original.meta.fixable).toBe('code');
  });

  it('does not mutate original rules with suggestions', () => {
    const path = require('path');
    const eslintPkg = require.resolve('eslint/package.json');
    const rulesDir = path.join(path.dirname(eslintPkg), 'lib', 'rules');
    const original = require(path.join(rulesDir, 'no-console.js'));
    expect(original.meta.hasSuggestions).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Plugin discovery (builtin rules — always available)
// ---------------------------------------------------------------------------

describe('plugin discovery', () => {
  it('loads builtin ESLint rules', () => {
    const builtinCount = Object.keys(disableAutofix.rules).filter(
      (r) => !r.includes('/'),
    ).length;
    // ESLint 10 has ~291 rules
    expect(builtinCount).toBeGreaterThan(250);
  });

  it('includes common builtin rules', () => {
    const expectedRules = [
      'prefer-const',
      'no-var',
      'semi',
      'no-console',
      'no-unused-vars',
      'eqeqeq',
      'no-extra-semi',
      'no-debugger',
    ];
    for (const rule of expectedRules) {
      expect(disableAutofix.rules[rule]).toBeDefined();
    }
  });

  it('excludes @types and @eslint packages', () => {
    const rules = Object.keys(disableAutofix.rules);
    const hasTypes = rules.some((r) => r.startsWith('@types/'));
    const hasEslint = rules.some(
      (r) => r.startsWith('@eslint/') && !r.startsWith('@eslint-community/'),
    );
    expect(hasTypes).toBe(false);
    expect(hasEslint).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Plugin structure & exports
// ---------------------------------------------------------------------------

describe('plugin structure', () => {
  it('has correct meta', () => {
    expect(disableAutofix.meta.name).toBe('eslint-plugin-disable-autofix');
    expect(disableAutofix.meta.version).toBe('6.0.0');
  });

  it('exports the required flat config plugin properties', () => {
    expect(disableAutofix.rules).toBeDefined();
    expect(disableAutofix.configs).toBeDefined();
    expect(disableAutofix.processors).toBeDefined();
    expect(disableAutofix.meta).toBeDefined();
  });

  it('all rules have a create function', () => {
    const rules = disableAutofix.rules as Record<string, { create: unknown }>;
    for (const [, rule] of Object.entries(rules)) {
      expect(typeof rule.create).toBe('function');
    }
  });

  it('none of the rules have fixable or hasSuggestions meta', () => {
    for (const [, rule] of Object.entries(
      disableAutofix.rules as Record<string, Rule.RuleModule>,
    )) {
      if (rule.meta) {
        expect(rule.meta.fixable).toBeUndefined();
        expect(rule.meta.hasSuggestions).toBeUndefined();
      }
    }
  });
});
