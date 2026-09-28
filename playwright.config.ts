import { defineConfig, devices } from '@playwright/test';
import { DEFAULT_BASE, E2E_PORT } from './scripts/config.ts';

// The suite runs against the production build (`npm run build:e2e`), served like GitHub Pages at the
// repo sub-path. Local Chromium plays H.264; CI can set PW_CHROMIUM_CHANNEL=chrome where it doesn't.
const baseURL = `http://localhost:${E2E_PORT}${DEFAULT_BASE}`;

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never', outputFolder: 'reports/playwright' }]] : [['list']],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    // A language already picked, so pages do not offer the other one (tests/e2e/language.spec.ts does).
    storageState: {
      cookies: [],
      origins: [{ origin: `http://localhost:${E2E_PORT}`, localStorage: [{ name: 'language', value: 'ar' }] }],
    },
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: `node scripts/serve.ts --dir dist --base ${DEFAULT_BASE} --port ${E2E_PORT} --host 127.0.0.1`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: 'desktop-chromium',
      use: { ...devices['Desktop Chrome'], channel: process.env.PW_CHROMIUM_CHANNEL || undefined },
    },
    {
      name: 'mobile-webkit',
      use: { ...devices['iPhone 15'] },
    },
  ],
});
