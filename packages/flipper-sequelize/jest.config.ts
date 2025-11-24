import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  reporters: [['default', { verbose: false }]],
  testMatch: ['<rootDir>/src/**/*.test.ts'],
  testTimeout: 5000,
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.test.ts'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: true,
      tsconfig: {
        module: 'ESNext',
        skipLibCheck: true,
      },
    }],
  },
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@flippercloud/flipper$': '<rootDir>/../../packages/flipper/src/index.ts',
  },
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
}

export default config

