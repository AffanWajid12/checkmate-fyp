export default {
  testEnvironment: 'node',
  transform: {
    '^.+\\.(t|j)sx?$': '@swc/jest',
  },
  extensionsToTreatAsEsm: ['.ts'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: ['**/tests/**/*.test.js'],
  clearMocks: true,
  moduleNameMapper: {
    // This allows intercepting imports to our supabase client and serving the mock instead
    '^../config/supabaseClient.js$': '<rootDir>/tests/mocks/supabaseClient.js',
    '^../../config/supabaseClient.js$': '<rootDir>/tests/mocks/supabaseClient.js'
  }
};
