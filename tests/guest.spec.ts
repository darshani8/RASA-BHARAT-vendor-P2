import { test, expect } from '@playwright/test';

// Logged-out surface (no stored session). Kept to a single failed login to stay under the
// backend's per-account rate limiter.
test.describe('Auth — logged out', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('login form renders all fields', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Vendor sign in' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: '+91 98765 43210' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: '••••••••' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
  });

  test('"Apply as a vendor" toggles the application form and back', async ({ page }) => {
    await page.getByText('Apply as a vendor', { exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Apply as a vendor' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: /Chai Stall/ })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Submit application' })).toBeVisible();
    await page.getByText('Sign in', { exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Vendor sign in' })).toBeVisible();
  });

  test('wrong credentials shows an inline error and stays on the login screen', async ({ page }) => {
    await page.getByRole('textbox', { name: '+91 98765 43210' }).fill('+919999999999');
    await page.getByRole('textbox', { name: '••••••••' }).fill('definitely-wrong');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(
      page.getByText(/Wrong phone number or password|Too many attempts|Can’t reach the server/),
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Vendor sign in' })).toBeVisible();
  });
});
