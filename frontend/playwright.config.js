import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  // DB-writing specs run only through playwright.e2e.config.js (isolated land_records_e2e stack)
  testIgnore: /role-dashboards\.spec\.js|state-apex-verify\.spec\.js/,
  fullyParallel: false,
  retries: 0,
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});

