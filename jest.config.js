/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // Specifies the test files to be executed by Jest.
  testMatch: ['**/__tests__/**/*.ts?(x)', '**/?(*.)+(spec|test).ts?(x)'],
  // Directories to be ignored by Jest when looking for test files.
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
};
