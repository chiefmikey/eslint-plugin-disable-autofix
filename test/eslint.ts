import { Linter } from 'eslint';

const eslint = async (text: string, config: Linter.FlatConfig) => {
  try {
    const linter = new Linter();
    return linter.verifyAndFix(text, [config]);
  } catch (error) {
    return error;
  }
};

export default eslint;
