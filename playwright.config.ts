import { defineConfig } from '@playwright/test';

// Watchable E2E config: ONE visible Chromium, serial, slow-mo so a human can follow every step.
// A single login is captured once (auth.setup) and reused via storageState — this avoids the
// backend's per-account login rate limiter that trips when every test logs in fresh.
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:8080',
    headless: false, // show the browser on screen
    viewport: null, // use the real window size → fills the maximized window / whole screen
    launchOptions: { slowMo: 400, args: ['--start-maximized'] }, // maximized + slow enough to watch
    actionTimeout: 15_000,
    navigationTimeout: 20_000,
    trace: 'on',
    video: 'on',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    // Logged-out flows (login form, apply, bad-credentials) — no stored session.
    { name: 'guest', testMatch: /guest\.spec\.ts/ },
    // Everything else runs authenticated, reusing the captured vendor session.
    {
      name: 'vendor',
      testIgnore: [/auth\.setup\.ts/, /guest\.spec\.ts/],
      use: { storageState: 'tests/.auth/vendor.json' },
      dependencies: ['setup'],
    },
  ],
});
