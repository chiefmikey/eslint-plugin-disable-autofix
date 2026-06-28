import type { JestConfigWithTsJest } from 'ts-jest';

const jestConfig: JestConfigWithTsJest = {
  modulePathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/.claude/'],
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
};

export default jestConfig;
