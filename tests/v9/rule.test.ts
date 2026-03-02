import { describe, expect, it } from '@jest/globals';
import type { Linter } from 'eslint';

import { builtin, unicorn, babel, suggestions } from './configs';
import eslint from './eslint';
import { lintWithMessages } from './eslint';

describe('disable autofix', () => {
  it('fixes the builtin rule', async () => {
    expect.hasAssertions();
    const inputText = 'let test = true;';
    const outputText = 'const test = true;';
    const results = (await eslint(inputText, builtin.fix)) as Linter.FixReport;
    expect(results.output).toBe(outputText);
    expect(results.fixed).toBe(true);
  });

  it('does not fix the builtin rule', async () => {
    expect.hasAssertions();
    const inputText = 'let test = true;';
    const results = (await eslint(
      inputText,
      builtin.disable,
    )) as Linter.FixReport;
    expect(results.output).toBe(inputText);
    expect(results.fixed).toBe(false);
  });

  it('fixes the plugin rule', async () => {
    expect.hasAssertions();
    const inputText = 'const env = true';
    const outputText = 'const environment = true';
    const results = (await eslint(inputText, unicorn.fix)) as Linter.FixReport;
    expect(results.output).toBe(outputText);
    expect(results.fixed).toBe(true);
  });

  it('does not fix the plugin rule', async () => {
    expect.hasAssertions();
    const inputText = 'const environment = true';
    const results = (await eslint(
      inputText,
      unicorn.disable,
    )) as Linter.FixReport;
    expect(results.output).toBe(inputText);
    expect(results.fixed).toBe(false);
  });

  it('fixes the scoped plugin rule', async () => {
    expect.hasAssertions();
    const inputText = 'const object = { property: true }';
    const outputText = 'const object = {property: true}';
    const results = (await eslint(inputText, babel.fix)) as Linter.FixReport;
    expect(results.output).toBe(outputText);
    expect(results.fixed).toBe(true);
  });

  it('does not fix the scoped plugin rule', async () => {
    expect.hasAssertions();
    const inputText = 'const object = { property: true }';
    const results = (await eslint(
      inputText,
      babel.disable,
    )) as Linter.FixReport;
    expect(results.output).toBe(inputText);
    expect(results.fixed).toBe(false);
  });
});

describe('disable suggestions', () => {
  it('reports suggestions on the original rule', async () => {
    expect.hasAssertions();
    const inputText = 'console.log("test")';
    const results = await lintWithMessages(inputText, suggestions.fix);
    const message = results[0];
    expect(message.suggestions).toBeDefined();
    expect(message.suggestions!.length).toBeGreaterThan(0);
  });

  it('strips suggestions on the disabled rule', async () => {
    expect.hasAssertions();
    const inputText = 'console.log("test")';
    const results = await lintWithMessages(inputText, suggestions.disable);
    expect(results.length).toBeGreaterThan(0);
    const message = results[0];
    expect(message.suggestions).toBeUndefined();
  });
});

describe('metadata stripping', () => {
  it('removes fixable from rule meta', () => {
    expect.hasAssertions();
    const disableAutofix = require('eslint-plugin-disable-autofix');
    expect(disableAutofix.rules['prefer-const'].meta?.fixable).toBeUndefined();
  });

  it('removes hasSuggestions from rule meta', () => {
    expect.hasAssertions();
    const disableAutofix = require('eslint-plugin-disable-autofix');
    expect(
      disableAutofix.rules['no-console'].meta?.hasSuggestions,
    ).toBeUndefined();
  });

  it('preserves other meta properties', () => {
    expect.hasAssertions();
    const disableAutofix = require('eslint-plugin-disable-autofix');
    const meta = disableAutofix.rules['prefer-const'].meta;
    expect(meta?.type).toBeDefined();
    expect(meta?.docs).toBeDefined();
  });
});
