import { defineConfig } from '@playwright/test';

/** Side-by-side screenshots of reference/index.html (left) and the app (right), with a pixel count. Output: e2e/parity-shots. */
export default defineConfig({
  testDir: 'e2e',
  testMatch: ['parity.spec.ts', 'screenshots.spec.ts'],
  timeout: 120_000,
  use: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, reducedMotion: 'reduce' },
  webServer: { command: 'npx vite --port 5181 --strictPort', port: 5181, reuseExistingServer: true },
});
