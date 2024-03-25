module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testRegex: 'src/.*_test\\.ts$',
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
}
