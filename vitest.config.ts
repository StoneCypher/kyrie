
import { defineConfig } from 'vitest/config';


export default defineConfig({

  test: {
    include: ['src/**/*.test.ts'],
    exclude: ['dist/**', 'node_modules/**'],
    coverage: {
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts'],
    },
    globals: true
  },

});
