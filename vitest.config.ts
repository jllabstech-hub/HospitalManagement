import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    fileParallelism: false,
    include: ['src/**/*.test.ts'],
    exclude: ['node_modules', 'e2e/**'],
    env: {
      NODE_ENV: 'test',
      DATABASE_URL:
        process.env.DATABASE_URL ||
        process.env.UNIT_TEST_DATABASE_URL ||
        'postgresql://postgres:postgres@127.0.0.1:5432/hospital_unit?schema=public',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
