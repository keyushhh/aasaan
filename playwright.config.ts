import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  testIgnore: ['parity.spec.ts', 'screenshots.spec.ts'],
  use: { baseURL: 'http://localhost:5183/', viewport: { width: 390, height: 844 } },
  webServer: { command: 'npx vite --port 5183 --strictPort', port: 5183, reuseExistingServer: true },
});
