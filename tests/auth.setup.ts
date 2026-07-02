import { test as setup, expect } from '@playwright/test';

// Logs in ONCE as the seeded pilot vendor and saves the session (token in localStorage) so every
// other test reuses it — one login, no rate-limit cascade.
const authFile = 'tests/.auth/vendor.json';

setup('authenticate as the pilot vendor', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: '+91 98765 43210' }).fill('+910000000002');
  await page.getByRole('textbox', { name: '••••••••' }).fill('Pilot@12345');
  await page.getByRole('button', { name: 'Sign in' }).click();

  // Authenticated shell has loaded once the sidebar nav is present.
  await expect(page.getByRole('link', { name: /Point of Sale/ })).toBeVisible({ timeout: 20_000 });

  await page.context().storageState({ path: authFile });
});
