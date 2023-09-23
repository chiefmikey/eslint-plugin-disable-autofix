import { builtin, unicorn } from './configs';
import eslint from './eslint';

interface Results {
  output: string | undefined;
  message: string | undefined;
}

describe('rules', () => {
  it('fixes the builtin rule', async () => {
    expect.hasAssertions();
    const inputText = 'let test = true;';
    const outputText = 'const test = true;';
    const results = (await eslint(inputText, builtin.fix)) as Results;
    expect(results).toBe(outputText);
  });
  it('does not fix the builtin rule', async () => {
    expect.hasAssertions();
    const inputText = 'let test = true;';
    const results = (await eslint(inputText, builtin.disable)) as Results;
    expect(results).toBeUndefined();
  });
  it('fixes the plugin rule', async () => {
    expect.hasAssertions();
    const inputText = 'const env = true';
    const outputText = 'const environment = true';
    const results = (await eslint(inputText, unicorn.fix)) as Results;
    expect(results).toBe(outputText);
  });
  it('does not fix the plugin rule', async () => {
    expect.hasAssertions();
    const inputText = 'const environment = true';
    const results = (await eslint(inputText, unicorn.disable)) as Results;
    expect(results).toBeUndefined();
  });
});
