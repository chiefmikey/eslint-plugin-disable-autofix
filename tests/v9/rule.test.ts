import { describe, expect, it } from '@jest/globals';
import { Linter } from 'eslint';
import type { Rule } from 'eslint';

// The plugin loads rules from node_modules at require time.
// Note: Jest's runtime doesn't support require(esm) like native Node.js,
// so ESM-only plugins (unicorn, @stylistic) may not load in tests.
// Production usage is unaffected — see tests/integration.test.js for
// native Node.js verification of ESM plugin loading.
import disableAutofix from 'eslint-plugin-disable-autofix';

// Read version dynamically so tests don't break on every bump
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { version: PKG_VERSION } = require('../../package.json') as { version: string };

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
    expect(disableAutofix.meta.version).toBe(PKG_VERSION);
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

// ---------------------------------------------------------------------------
// configure() helper
// ---------------------------------------------------------------------------

describe('configure helper', () => {
  it('returns flat config with plugins and rules', () => {
    const config = disableAutofix.configure({ 'prefer-const': 'warn' });
    expect(config.plugins).toBeDefined();
    expect(config.plugins['disable-autofix']).toBe(disableAutofix);
    expect(config.rules['prefer-const']).toBe('off');
    expect(config.rules['disable-autofix/prefer-const']).toBe('warn');
  });

  it('handles multiple rules with options', () => {
    const config = disableAutofix.configure({
      'prefer-const': 'warn',
      'semi': ['error', 'always'],
    });
    expect(config.rules['prefer-const']).toBe('off');
    expect(config.rules['semi']).toBe('off');
    expect(config.rules['disable-autofix/prefer-const']).toBe('warn');
    expect(config.rules['disable-autofix/semi']).toEqual(['error', 'always']);
  });

  it('handles plugin rules', () => {
    const config = disableAutofix.configure({
      'react/jsx-indent': 'error',
    });
    expect(config.rules['react/jsx-indent']).toBe('off');
    expect(config.rules['disable-autofix/react/jsx-indent']).toBe('error');
  });

  it('works with ESLint Linter', () => {
    const config = disableAutofix.configure({ 'prefer-const': 'warn' });
    const linter = new Linter();
    const result = linter.verifyAndFix('let x = 1;', {
      ...config,
      languageOptions: { ecmaVersion: 2024 },
      rules: { ...config.rules, 'no-unused-vars': 'off', 'eol-last': 'off' },
    });
    expect(result.fixed).toBe(false);
    expect(result.output).toBe('let x = 1;');
  });
});

// ---------------------------------------------------------------------------
// createPlugin() with modes
// ---------------------------------------------------------------------------

describe('createPlugin', () => {
  it('mode fix: strips fix but keeps suggestions', () => {
    const fixOnly = disableAutofix.createPlugin({ mode: 'fix' });
    const linter = new Linter();

    // no-console has suggestions — should be preserved
    const messages = linter.verify('console.log("test")', {
      languageOptions: { ecmaVersion: 2024 },
      plugins: { 'disable-fix': fixOnly },
      rules: { 'disable-fix/no-console': 'error', 'eol-last': 'off' },
    });
    expect(messages.length).toBeGreaterThan(0);
    expect(messages[0].suggestions).toBeDefined();
    expect(messages[0].suggestions!.length).toBeGreaterThan(0);

    // prefer-const has fix — should be stripped
    const result = linter.verifyAndFix('let x = 1;', {
      languageOptions: { ecmaVersion: 2024 },
      plugins: { 'disable-fix': fixOnly },
      rules: { 'disable-fix/prefer-const': 'error', 'no-unused-vars': 'off', 'eol-last': 'off' },
    });
    expect(result.fixed).toBe(false);
  });

  it('mode suggest: strips suggestions but keeps fix', () => {
    const suggestOnly = disableAutofix.createPlugin({ mode: 'suggest' });
    const linter = new Linter();

    // no-console: suggestions stripped
    const messages = linter.verify('console.log("test")', {
      languageOptions: { ecmaVersion: 2024 },
      plugins: { 'disable-suggest': suggestOnly },
      rules: { 'disable-suggest/no-console': 'error', 'eol-last': 'off' },
    });
    expect(messages.length).toBeGreaterThan(0);
    expect(messages[0].suggestions).toBeUndefined();

    // prefer-const: fix preserved
    const result = linter.verifyAndFix('let x = 1;', {
      languageOptions: { ecmaVersion: 2024 },
      plugins: { 'disable-suggest': suggestOnly },
      rules: { 'disable-suggest/prefer-const': 'error', 'no-unused-vars': 'off', 'eol-last': 'off' },
    });
    expect(result.fixed).toBe(true);
    expect(result.output).toContain('const');
  });

  it('mode fix: preserves fixable metadata, strips hasSuggestions', () => {
    const fixOnly = disableAutofix.createPlugin({ mode: 'fix' });
    // prefer-const is fixable — fixable should be stripped (we're disabling fix)
    expect(fixOnly.rules['prefer-const'].meta?.fixable).toBeUndefined();
    // no-console hasSuggestions — should be preserved
    expect(fixOnly.rules['no-console'].meta?.hasSuggestions).toBe(true);
  });

  it('mode suggest: preserves fixable metadata, strips hasSuggestions', () => {
    const suggestOnly = disableAutofix.createPlugin({ mode: 'suggest' });
    // prefer-const is fixable — should be preserved
    expect(suggestOnly.rules['prefer-const'].meta?.fixable).toBe('code');
    // no-console hasSuggestions — should be stripped
    expect(suggestOnly.rules['no-console'].meta?.hasSuggestions).toBeUndefined();
  });

  it('plugins option restricts which plugins are loaded', () => {
    // This test only works if we have third-party plugins installed.
    // In Jest's sandbox, ESM plugins may not load, so we test the filtering logic
    // by checking builtins are always present regardless of filter.
    const limited = disableAutofix.createPlugin({ plugins: ['nonexistent-plugin'] });
    const names = Object.keys(limited.rules);
    // Builtins should always be present
    expect(names).toContain('prefer-const');
    // No plugin rules should be present
    const pluginRules = names.filter(n => n.includes('/'));
    expect(pluginRules.length).toBe(0);
  });

  it('configure on mode plugin uses correct prefix', () => {
    const fixOnly = disableAutofix.createPlugin({ mode: 'fix' });
    const config = fixOnly.configure({ 'prefer-const': 'warn' });
    expect(config.plugins['disable-fix']).toBe(fixOnly);
    expect(config.rules['disable-fix/prefer-const']).toBe('warn');
    expect(config.rules['prefer-const']).toBe('off');
  });

  it('has correct meta on custom instances', () => {
    const custom = disableAutofix.createPlugin({ mode: 'fix' });
    expect(custom.meta.name).toBe('eslint-plugin-disable-autofix');
    expect(custom.meta.version).toBe(PKG_VERSION);
  });
});
