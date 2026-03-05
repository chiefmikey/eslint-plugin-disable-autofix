/**
 * Integration test that runs in native Node.js (not Jest).
 * Verifies ESM plugin loading, lazy loading, configure(), and createPlugin().
 *
 * Jest's VM sandbox doesn't support require(esm), so this test validates
 * what Jest can't: that ESM-only plugins (unicorn, @stylistic) are correctly
 * loaded and wrapped.
 *
 * Run with: node --test tests/integration.test.js
 */

const assert = require('node:assert/strict');
const { test, describe } = require('node:test');

const plugin = require('eslint-plugin-disable-autofix');

// ─── Rule Discovery ─────────────────────────────────────────────────────────

describe('rule discovery', () => {
  test('loads builtin ESLint rules', () => {
    const builtinRules = Object.keys(plugin.rules).filter(
      (r) => !r.includes('/'),
    );
    assert.ok(
      builtinRules.length > 250,
      `Expected >250 builtin rules, got ${builtinRules.length}`,
    );
  });

  test('loads ESM plugin rules (eslint-plugin-unicorn)', () => {
    const unicornRules = Object.keys(plugin.rules).filter((r) =>
      r.startsWith('unicorn/'),
    );
    assert.ok(
      unicornRules.length > 50,
      `Expected >50 unicorn rules, got ${unicornRules.length}`,
    );
  });

  test('loads scoped ESM plugin rules (@stylistic/eslint-plugin)', () => {
    const stylisticRules = Object.keys(plugin.rules).filter((r) =>
      r.startsWith('@stylistic/'),
    );
    assert.ok(
      stylisticRules.length > 50,
      `Expected >50 @stylistic rules, got ${stylisticRules.length}`,
    );
  });

  test('ESM plugin rules have no fixable or hasSuggestions', () => {
    const unicornRules = Object.entries(plugin.rules).filter(([r]) =>
      r.startsWith('unicorn/'),
    );
    for (const [name, rule] of unicornRules) {
      if (rule.meta) {
        assert.equal(rule.meta.fixable, undefined, `${name} has fixable`);
        assert.equal(rule.meta.hasSuggestions, undefined, `${name} has hasSuggestions`);
      }
    }
  });
});

// ─── Plugin Meta ────────────────────────────────────────────────────────────

test('plugin meta is correct', () => {
  assert.equal(plugin.meta.name, 'eslint-plugin-disable-autofix');
  assert.equal(plugin.meta.version, '6.1.0');
});

// ─── Behavioral Tests ───────────────────────────────────────────────────────

describe('behavioral', () => {
  test('scoped plugin rules work with ESLint Linter', () => {
    const { Linter } = require('eslint');
    const linter = new Linter();
    const result = linter.verifyAndFix('const x = 1', [
      {
        languageOptions: { ecmaVersion: 2024 },
        plugins: { 'disable-autofix': plugin },
        rules: {
          'disable-autofix/@stylistic/semi': ['warn', 'always'],
          'eol-last': 'off',
        },
      },
    ]);
    assert.equal(result.fixed, false);
    assert.equal(result.output, 'const x = 1');
  });

  test('ESM plugin rules still report violations', () => {
    const { Linter } = require('eslint');
    const linter = new Linter();
    const messages = linter.verify('const x = 1', [
      {
        languageOptions: { ecmaVersion: 2024 },
        plugins: { 'disable-autofix': plugin },
        rules: {
          'disable-autofix/@stylistic/semi': ['warn', 'always'],
          'eol-last': 'off',
        },
      },
    ]);
    assert.ok(messages.length > 0);
    assert.equal(messages[0].ruleId, 'disable-autofix/@stylistic/semi');
  });
});

// ─── Lazy Loading ───────────────────────────────────────────────────────────

describe('lazy loading', () => {
  test('individual rule access works without full enumeration', () => {
    // Access a single builtin rule — should work without loading all plugins
    const rule = plugin.rules['prefer-const'];
    assert.ok(rule);
    assert.equal(typeof rule.create, 'function');
  });

  test('plugin rule access works lazily', () => {
    const rule = plugin.rules['unicorn/no-array-push-push'];
    assert.ok(rule);
    assert.equal(typeof rule.create, 'function');
    assert.equal(rule.meta?.fixable, undefined);
  });

  test('"in" operator works for rules', () => {
    assert.ok('prefer-const' in plugin.rules);
    assert.ok('unicorn/no-array-push-push' in plugin.rules);
    assert.ok(!('nonexistent-rule' in plugin.rules));
  });
});

// ─── configure() ────────────────────────────────────────────────────────────

describe('configure', () => {
  test('returns working flat config', () => {
    const { Linter } = require('eslint');
    const linter = new Linter();
    const config = plugin.configure({ 'prefer-const': 'warn' });

    const result = linter.verifyAndFix('let x = 1;', [
      {
        languageOptions: { ecmaVersion: 2024 },
        ...config,
        rules: { ...config.rules, 'no-unused-vars': 'off', 'eol-last': 'off' },
      },
    ]);
    assert.equal(result.fixed, false);
    assert.equal(result.output, 'let x = 1;');
  });

  test('works with ESM plugin rules', () => {
    const { Linter } = require('eslint');
    const linter = new Linter();
    const config = plugin.configure({
      '@stylistic/semi': ['error', 'always'],
    });

    const result = linter.verifyAndFix('const x = 1', [
      {
        languageOptions: { ecmaVersion: 2024 },
        ...config,
        rules: { ...config.rules, 'eol-last': 'off' },
      },
    ]);
    assert.equal(result.fixed, false);
  });
});

// ─── createPlugin() with modes ──────────────────────────────────────────────

describe('createPlugin modes', () => {
  test('mode fix: strips fix, keeps suggestions', () => {
    const { Linter } = require('eslint');
    const linter = new Linter();
    const fixOnly = plugin.createPlugin({ mode: 'fix' });

    // Fix stripped
    const result = linter.verifyAndFix('let x = 1;', [
      {
        languageOptions: { ecmaVersion: 2024 },
        plugins: { 'disable-fix': fixOnly },
        rules: { 'disable-fix/prefer-const': 'error', 'no-unused-vars': 'off', 'eol-last': 'off' },
      },
    ]);
    assert.equal(result.fixed, false);

    // Suggestions preserved
    const messages = linter.verify('console.log("test")', [
      {
        languageOptions: { ecmaVersion: 2024 },
        plugins: { 'disable-fix': fixOnly },
        rules: { 'disable-fix/no-console': 'error', 'eol-last': 'off' },
      },
    ]);
    assert.ok(messages[0].suggestions && messages[0].suggestions.length > 0,
      'suggestions should be preserved in fix mode');
  });

  test('mode suggest: keeps fix, strips suggestions', () => {
    const { Linter } = require('eslint');
    const linter = new Linter();
    const suggestOnly = plugin.createPlugin({ mode: 'suggest' });

    // Fix preserved
    const result = linter.verifyAndFix('let x = 1;', [
      {
        languageOptions: { ecmaVersion: 2024 },
        plugins: { 'disable-suggest': suggestOnly },
        rules: { 'disable-suggest/prefer-const': 'error', 'no-unused-vars': 'off', 'eol-last': 'off' },
      },
    ]);
    assert.equal(result.fixed, true);
    assert.ok(result.output.includes('const'));

    // Suggestions stripped
    const messages = linter.verify('console.log("test")', [
      {
        languageOptions: { ecmaVersion: 2024 },
        plugins: { 'disable-suggest': suggestOnly },
        rules: { 'disable-suggest/no-console': 'error', 'eol-last': 'off' },
      },
    ]);
    assert.ok(!messages[0].suggestions || messages[0].suggestions.length === 0,
      'suggestions should be stripped in suggest mode');
  });

  test('plugins option filters rules', () => {
    const limited = plugin.createPlugin({ plugins: ['unicorn'] });
    const names = Object.keys(limited.rules);

    const unicornRules = names.filter(n => n.startsWith('unicorn/'));
    const stylisticRules = names.filter(n => n.startsWith('@stylistic/'));
    const builtinRules = names.filter(n => !n.includes('/'));

    assert.ok(unicornRules.length > 50, 'should have unicorn rules');
    assert.equal(stylisticRules.length, 0, 'should not have @stylistic rules');
    assert.ok(builtinRules.length > 250, 'should still have builtins');
  });

  test('configure on mode instance uses correct prefix', () => {
    const fixOnly = plugin.createPlugin({ mode: 'fix' });
    const config = fixOnly.configure({ 'prefer-const': 'warn' });

    assert.ok(config.plugins['disable-fix']);
    assert.equal(config.rules['prefer-const'], 'off');
    assert.equal(config.rules['disable-fix/prefer-const'], 'warn');
  });
});
