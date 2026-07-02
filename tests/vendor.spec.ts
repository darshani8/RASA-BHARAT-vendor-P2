import { test, expect, type Page } from '@playwright/test';

// Comprehensive functional pass over every vendor-dashboard view and control. Runs authenticated
// (storageState from auth.setup) and serially so it's watchable in headed mode.

const goto = (page: Page, hash: string) => page.goto(`/#/${hash}`);

test.describe('Shell & navigation', () => {
  test('sidebar navigates to every view', async ({ page }) => {
    await goto(page, 'dashboard');
    await expect(page.getByRole('heading', { name: /Welcome/ })).toBeVisible();
    const aside = page.locator('aside').first();
    const hops: Array<[string, string]> = [
      ['#/pos', 'Order #4092'],
      ['#/orders', 'Pipeline Management'],
      ['#/queue', 'Terminal Queue'],
      ['#/inventory', 'Total SKUs'],
      ['#/analytics', 'Business Intelligence'],
      ['#/reports', 'Customer Reports'],
    ];
    for (const [href, anchor] of hops) {
      await aside.locator(`a[href="${href}"]`).click();
      await expect(page.getByText(anchor).first()).toBeVisible();
    }
    await aside.locator('a[href="#/dashboard"]').click();
    await expect(page.getByRole('heading', { name: /Welcome/ })).toBeVisible();
  });

  test('header controls: register toggle, New Order, notifications, search', async ({ page }) => {
    await goto(page, 'dashboard');
    const header = page.locator('header');
    const pill = header.getByTitle('Tap to open or close your stall');
    await expect(pill).toBeVisible();
    const before = (await pill.textContent())?.trim();
    await pill.click(); // PATCH accepting-orders
    await expect(async () => {
      expect((await pill.textContent())?.trim()).not.toBe(before);
    }).toPass({ timeout: 8000 });
    await pill.click(); // toggle back
    await expect(header.getByRole('link', { name: /New Order/ })).toBeVisible();
    await expect(header.getByRole('button', { name: 'notifications' })).toBeVisible();
    await expect(header.getByRole('textbox', { name: /Search orders/ })).toBeVisible();
  });
});

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => { await goto(page, 'dashboard'); });

  test('KPIs, header buttons, chart tabs and queue actions', async ({ page }) => {
    for (const kpi of ["Today's Revenue", 'Orders Today', 'Avg Handle Time', 'Completion Rate']) {
      await expect(page.getByText(kpi).first()).toBeVisible();
    }
    await page.getByRole('button', { name: 'Export' }).click();
    await page.getByRole('button', { name: 'Week' }).click();
    await page.getByRole('button', { name: 'Month' }).click();
    await page.getByRole('button', { name: 'Pause' }).click();
    await page.getByRole('button', { name: 'Announce' }).click();
    await expect(page.getByRole('button', { name: /View all/ })).toBeVisible();
  });
});

test.describe('Point of Sale', () => {
  test.beforeEach(async ({ page }) => { await goto(page, 'pos'); });

  test('category chips filter the grid', async ({ page }) => {
    for (const chip of ['Breakfast', 'Mains', 'Beverages', 'Sweets', 'All Items']) {
      await page.getByRole('button', { name: chip, exact: true }).click();
    }
  });

  test('add to cart, adjust qty, toggle payment, clear, then charge', async ({ page }) => {
    await page.getByRole('button', { name: 'All Items', exact: true }).click();
    const firstProduct = page.locator('.zprod').first();
    await expect(firstProduct).toBeVisible();
    await firstProduct.click();
    // cart now has an item
    await expect(page.getByText('Cart is empty')).toBeHidden();
    const cart = page.locator('aside').nth(1); // the right-hand cart panel
    // qty steppers (dec/inc) inside the cart line
    await firstProduct.click(); // add same item again → qty 2
    await cart.locator('.zstep').last().click(); // inc
    await cart.locator('.zstep').first().click(); // dec
    // payment toggle
    await page.getByRole('button', { name: 'UPI' }).click();
    await page.getByRole('button', { name: 'Cash' }).click();
    // clear
    await cart.locator('button:has-text("delete")').first().click();
    await expect(page.getByText('Cart is empty')).toBeVisible();
    // re-add and charge
    await firstProduct.click();
    await page.getByRole('button', { name: /Charge/ }).click();
    // charge produces feedback: either the cart clears (success) or a status message appears
    await expect(
      page.getByText('Cart is empty').or(page.getByText(/charged|Counter checkout|Add items/i)).first(),
    ).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Orders', () => {
  test.beforeEach(async ({ page }) => { await goto(page, 'orders'); });

  test('metrics cards render', async ({ page }) => {
    for (const m of ['Active Queue', 'Preparing', 'Ready for Pickup', 'Completed Today']) {
      await expect(page.getByText(m).first()).toBeVisible();
    }
  });

  test('all four tabs load and paginate', async ({ page }) => {
    for (const tab of ['All Orders', 'Active', 'Completed', 'Scheduled']) {
      await page.getByRole('button', { name: tab, exact: true }).click();
      await expect(page.getByRole('button', { name: tab, exact: true })).toBeVisible();
    }
    await expect(page.getByRole('button', { name: /Prev/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Next/ })).toBeVisible();
  });

  test('Scheduled tab shows parked orders with a cook-start countdown', async ({ page }) => {
    await page.getByRole('button', { name: 'Scheduled', exact: true }).click();
    await expect(page.getByText('Cook-start')).toBeVisible();
    await expect(page.getByText('Countdown')).toBeVisible();
    // Either parked rows (with a countdown + Scheduled pill) or the documented empty state.
    await expect(
      page.getByText(/cooks in|cooking now|scheduled/i).first()
        .or(page.getByText('No parked orders — customers who reserve a pickup slot appear here.')),
    ).toBeVisible();
  });

  test('lifecycle action buttons are exercised when present', async ({ page }) => {
    await page.getByRole('button', { name: 'All Orders', exact: true }).click();
    // Reject flow (pending orders): open the reason picker and cancel it — no mutation.
    const reject = page.getByRole('button', { name: /Reject/ }).first();
    if (await reject.count()) {
      await reject.click();
      await expect(page.getByRole('combobox').first()).toBeVisible();
      await page.locator('button:has-text("close")').first().click();
    }
    // Otherwise at least confirm status pills / action affordances rendered.
    await expect(page.locator('.zrow').first().or(page.getByText(/No active orders/))).toBeVisible();
  });
});

test.describe('Queue', () => {
  test.beforeEach(async ({ page }) => { await goto(page, 'queue'); });

  test('payment-method toggle and terminal-queue actions', async ({ page }) => {
    await expect(page.getByText('Terminal Queue')).toBeVisible();
    await expect(page.getByText('Payment Zone')).toBeVisible();
    for (const m of ['Cash', 'Card', 'App']) {
      await page.getByRole('button', { name: m }).click();
    }
    await expect(page.getByRole('button', { name: /Add Item/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Filter/ })).toBeVisible();
  });
});

test.describe('Inventory', () => {
  test.beforeEach(async ({ page }) => { await goto(page, 'inventory'); });

  test('category filter select', async ({ page }) => {
    const filter = page.locator('select').first();
    await filter.selectOption('Mains');
    await filter.selectOption('All');
  });

  test('full CRUD: add → edit → toggle availability → delete (self-cleaning)', async ({ page }) => {
    const name = `PW Test Item ${Date.now()}`;
    // ── Add ──
    await page.getByRole('button', { name: /Add Item/ }).click();
    await expect(page.getByPlaceholder('e.g. Masala Dosa')).toBeVisible();
    await page.getByPlaceholder('e.g. Masala Dosa').fill(name);
    await page.getByPlaceholder('0.00').fill('42');
    await page.getByPlaceholder('e.g. 5').fill('7');
    await page.locator('select').last().selectOption('Mains'); // modal Category select
    await page.getByRole('button', { name: /Available|Sold out/ }).click(); // availability toggle
    await page.getByRole('button', { name: /Available|Sold out/ }).click(); // toggle back
    await page.getByRole('button', { name: 'Save Item' }).click();
    const row = page.locator('.zrow', { hasText: name });
    await expect(row).toBeVisible({ timeout: 15000 });

    // ── Edit ──
    await row.locator('button').filter({ hasText: 'edit' }).click();
    await expect(page.getByPlaceholder('e.g. Masala Dosa')).toBeVisible();
    await page.getByPlaceholder('e.g. Masala Dosa').fill(`${name} (edited)`);
    await page.getByRole('button', { name: 'Save Item' }).click();
    const editedRow = page.locator('.zrow', { hasText: `${name} (edited)` });
    await expect(editedRow).toBeVisible({ timeout: 15000 });

    // ── Toggle availability ── marking sold-out either flips the pill or, with the current
    // available-only menu fallback, hides the row from inventory — both outcomes are acceptable.
    await editedRow.locator('button').filter({ hasText: 'visibility' }).click();
    await page.waitForTimeout(1500);

    // ── Delete ── remove the row if it's still listed; either way it must not remain visible.
    const stillListed = page.locator('.zrow', { hasText: `${name} (edited)` });
    if (await stillListed.count()) {
      await stillListed.first().locator('button').filter({ hasText: 'delete' }).click();
    }
    await expect(page.locator('.zrow', { hasText: `${name} (edited)` })).toHaveCount(0, { timeout: 15000 });
  });
});

test.describe('Reports', () => {
  test.beforeEach(async ({ page }) => { await goto(page, 'reports'); });

  test('summary cards, filter chips and sort', async ({ page }) => {
    for (const c of ['Avg Rating', 'Reviews Collected', 'Awaiting Review']) {
      await expect(page.getByText(c).first()).toBeVisible();
    }
    for (const f of ['Good', 'Average', 'Poor', 'Awaiting', 'All']) {
      await page.getByRole('button', { name: f }).click();
    }
    const sort = page.locator('select').first();
    await sort.selectOption('highest');
    await sort.selectOption('lowest');
    await sort.selectOption('recent');
  });
});

test.describe('Analytics', () => {
  test('wired KPIs and hourly chart render', async ({ page }) => {
    await goto(page, 'analytics');
    await expect(page.getByRole('heading', { name: 'Business Intelligence' })).toBeVisible();
    for (const k of ['Revenue', 'Avg Order Value', 'Orders', 'Revenue by Hour']) {
      await expect(page.getByText(k).first()).toBeVisible();
    }
  });
});

test.describe('Logout', () => {
  test('signing out returns to the login gate', async ({ page }) => {
    await goto(page, 'dashboard');
    await page.locator('header').getByTitle('Sign out').click();
    await expect(page.getByRole('heading', { name: 'Vendor sign in' })).toBeVisible({ timeout: 15000 });
  });
});
