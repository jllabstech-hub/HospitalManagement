import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    fileParallelism: false,
    include: ['src/**/*.test.ts'],
    exclude: ['node_modules', 'e2e/**'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@prisma/client': path.resolve(__dirname, './node_modules/.prisma/cms-client'),
    },
  },
});
