import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      // Points d'entrée : testés de bout en bout dans un processus séparé, invisible pour la couverture.
      exclude: ['src/**/*.test.ts', 'src/cli.ts', 'src/server/main.ts'],
      thresholds: { lines: 95, functions: 95, branches: 95, statements: 95 },
    },
  },
});
