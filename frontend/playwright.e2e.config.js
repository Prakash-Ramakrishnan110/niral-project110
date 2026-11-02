import { defineConfig, devices } from '@playwright/test';

// Isolated E2E config. Requires `scripts/e2e_up.ps1` first (separate backend :8001 + DB land_records_e2e).
// The dev server runs in Vite mode "e2e" on :5174 and proxies /api to the e2e backend.
export default defineConfig({
  testDir: './tests',
  testMatch: /role-dashboards\.spec\.js|state-apex-verify\.spec\.js/,
  fullyParallel: false,
  retries: 0,
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:5174',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npx vite --mode e2e --host 127.0.0.1 --port 5174 --strictPort',
    url: 'http://127.0.0.1:5174',
    reuseExistingServer: false,
    timeout: 60000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});

