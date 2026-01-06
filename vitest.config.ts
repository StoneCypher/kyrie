
import { defineConfig } from 'vitest/config';



export default defineConfig({

  test: {
    include: ['src/**/*.test.ts'],
    exclude: ['dist/**', 'node_modules/**'],
    coverage: {
      enabled: true,
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts'],
      all: true,
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80
    },
    globals: true
  },

});
