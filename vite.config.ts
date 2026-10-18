import { defineConfig } from 'vitest/config';
export default defineConfig({
  // Assets relativos: funciona en /cotiza-3d/ y en un dominio propio.
  base: './',
  test: { include: ['tests/**/*.test.ts'] },
});
