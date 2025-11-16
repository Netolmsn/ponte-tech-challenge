module.exports = {
  preset: 'jest-preset-angular',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setup-jest.ts'],
  globalSetup: 'jest-preset-angular/global-setup',
  testMatch: ['**/?(*.)+(spec|test).+(ts)'],
  moduleFileExtensions: ['ts', 'html', 'js', 'json'],
  transform: {
    '^.+\\.(ts|mjs|js|html)$': 'jest-preset-angular',
  },
  moduleNameMapper: {
    '\\.(html)$': '<rootDir>/src/__mocks__/html.mock.js',
  },
  collectCoverage: true,
  collectCoverageFrom: ['src/app/**/*.ts', '!src/app/**/*.spec.ts', '!src/main.ts'],
  coverageDirectory: '<rootDir>/coverage',
};

