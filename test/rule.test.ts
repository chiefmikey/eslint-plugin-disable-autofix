import { describe, expect, it } from '@jest/globals';
import type { Linter } from 'eslint';

import { builtin, unicorn, babel } from './configs';
import eslint from './eslint';

describe('test rule fix disable', () => {
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
