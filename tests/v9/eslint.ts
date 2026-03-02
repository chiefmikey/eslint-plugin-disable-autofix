import { Linter } from 'eslint';

const eslint = async (text: string, config: Linter.Config) => {
  try {
    const linter = new Linter();
    return linter.verifyAndFix(text, [config]);
  } catch (error) {
    return error;
  }
};

export const lintWithMessages = async (
  text: string,
  config: Linter.Config,
): Promise<Linter.LintMessage[]> => {
  const linter = new Linter();
  return linter.verify(text, [config]);
};

export default eslint;
