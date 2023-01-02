import type { JestConfigWithTsJest } from 'ts-jest';

const jestConfig: JestConfigWithTsJest = {
  testEnvironment: 'node',
  preset: 'ts-jest',
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
  moduleNameMapper: {
    'eslint-plugin-disable-autofix':
      '<rootDir>/.yalc/eslint-plugin-disable-autofix',
  },
};

export default jestConfig;
