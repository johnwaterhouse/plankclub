import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./tests/setup.js'],

    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json', 'lcov'],
      exclude: ['tests/**', 'vitest.config.js', '*.config.js'],
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80
      }
    },

    include: ['tests/**/*.test.js'],
    exclude: ['node_modules', 'dist', '.git', '.claude'],
    testTimeout: 10000,
    clearMocks: true,
    restoreMocks: true,
    reporters: ['verbose']
  }
});
