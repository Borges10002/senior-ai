module.exports = {
  preset: 'jest-expo',
  testTimeout: 20000,
  modulePaths: ['<rootDir>/node_modules/expo/node_modules'],
  testMatch: ['<rootDir>/tests/**/*.test.[jt]s?(x)'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^expo-modules-core$': require.resolve('expo-modules-core', { paths: [require.resolve('expo/package.json')] }),
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  collectCoverageFrom: ['src/**/*.{ts,tsx}'],
  coverageDirectory: 'coverage',
};
