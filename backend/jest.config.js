module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",

  // Point to src
  roots: ["<rootDir>/src"],

  // Match test files
  testMatch: ["**/__tests__/**/*.ts", "**/?(*.)+(spec|test).ts"],

  // Transform TS files using ts-jest
  transform: {
    "^.+\\.ts$": "ts-jest",
  },

  // Coverage settings
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.d.ts",
    "!src/app.ts"
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],

  // Setup file
  setupFilesAfterEnv: ["<rootDir>/src/tests/setup.ts"],

  testTimeout: 10000,
};