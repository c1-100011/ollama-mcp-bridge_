module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  // Run tests sequentially
  maxWorkers: 1,
  // Verbose output
  verbose: true,
  // Detect open handles
  detectOpenHandles: true,
  // Force exit after tests complete
  forceExit: true
};
