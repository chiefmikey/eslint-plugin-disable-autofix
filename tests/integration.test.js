/**
 * Integration test that runs in native Node.js (not Jest).
 * Verifies ESM plugin loading and full plugin discovery.
 *
 * Jest's VM sandbox doesn't support require(esm), so this test
 * validates what Jest can't: that ESM-only plugins (unicorn, @stylistic)
 * are correctly loaded and wrapped.
 *
 * Run with: node tests/integration.test.js
 */

const assert = require('node:assert/strict');
const { test } = require('node:test');

const plugin = require('eslint-plugin-disable-autofix');

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
      assert.equal(
        rule.meta.fixable,
        undefined,
        `${name} should not have fixable`,
      );
      assert.equal(
        rule.meta.hasSuggestions,
        undefined,
        `${name} should not have hasSuggestions`,
      );
    }
  }
});

test('plugin meta is correct', () => {
  assert.equal(plugin.meta.name, 'eslint-plugin-disable-autofix');
  assert.equal(plugin.meta.version, '6.0.0');
});

test('scoped plugin rules work with ESLint Linter', () => {
  const { Linter } = require('eslint');
  const linter = new Linter();

  // Verify @stylistic/semi doesn't fix
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
  assert.equal(result.fixed, false, 'Should not fix the code');
  assert.equal(result.output, 'const x = 1', 'Output should match input');
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
  assert.ok(messages.length > 0, 'Should report violation');
  assert.equal(messages[0].ruleId, 'disable-autofix/@stylistic/semi');
});
