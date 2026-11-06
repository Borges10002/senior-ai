import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser', testMatch: '**/*.e2e.ts', workers: 1, timeout: 45000,
  use: { baseURL: process.env.SECURITY_BROWSER_URL, browserName: 'chromium', channel: 'msedge', headless: true,
    screenshot: 'only-on-failure', trace: 'off' },
  reporter: 'list', outputDir: './test-results/security-browser',
});
