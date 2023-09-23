import { ESLint } from 'eslint';

const main = async (text: string, config: ESLint.ConfigData) => {
  try {
    const options: ESLint.Options = {
      fix: true,
      overrideConfig: config,
      useEslintrc: false,
      plugins: {
        'eslint-plugin-disable-autofix': require('../dist') as ESLint.Plugin,
      },
    };
    const eslint = new ESLint(options);
    const results = await eslint.lintText(text);

    return results[0].output;
  } catch (error) {
    return error;
  }
};

export default main;
