/** @type {import('jest').Config} */
module.exports = {
  rootDir: 'src',
  moduleFileExtensions: ['js', 'json', 'ts'],
  testRegex: '.*\\.spec\\.ts$',
  transform: { '^.+\\.ts$': 'ts-jest' },
  collectCoverageFrom: ['**/*.ts', '!main.ts', '!**/*.module.ts', '!database/migrations/**'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
};
