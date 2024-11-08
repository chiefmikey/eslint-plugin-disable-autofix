import type { JestConfigWithTsJest } from 'ts-jest';

const jestConfig: JestConfigWithTsJest = {
  testEnvironment: 'node',
  preset: 'ts-jest',
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
  testMatch: ['**/*.test.ts'],
};

export default jestConfig;
