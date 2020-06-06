module.exports = {
  preset: '@vue/cli-plugin-unit-jest',
  testMatch: ['<rootDir>/tests/*.test.js'],
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.{js,vue}'],
  coverageReporters: ['text'],
}
