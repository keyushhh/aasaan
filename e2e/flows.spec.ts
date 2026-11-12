import { expect, test, type Page } from '@playwright/test';

async function signIn(page: Page) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByLabel('Mobile number').fill('12345');
  await page.getByRole('button', { name: 'Get OTP' }).click();
  await expect(page.getByRole('alert')).toHaveText('Enter a valid 10-digit mobile number.');
  await page.getByLabel('Mobile number').fill('9876543210');
  await page.getByRole('button', { name: 'Get OTP' }).click();
  await page.getByLabel('6-digit OTP').fill('000000');
  await page.getByRole('button', { name: 'Verify' }).click();
  await expect(page.getByRole('alert')).toHaveText('That OTP doesn’t match. In this demo, use 123456.');
  await page.getByLabel('6-digit OTP').fill('123456');
  await page.getByRole('button', { name: 'Verify' }).click();
  await page.getByRole('button', { name: 'Link and continue' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('things need you today, Ananya');
}
const sheet = (page: Page) => page.getByRole('dialog');

test('sign in, pay the challan from home, and see it leave the queue', async ({ page }) => {
  await signIn(page);
  await expect(page.locator('h1 span').first()).toHaveText('4');
  await page.getByRole('button', { name: /Unpaid traffic challan/ }).click();
  await sheet(page).getByRole('button', { name: 'Pay ₹500' }).click();
  await expect(sheet(page).getByRole('button', { name: 'Confirming with your bank…' })).toBeDisabled();
  await expect(sheet(page).getByRole('heading', { name: 'Challan paid' })).toBeVisible();
  await sheet(page).getByRole('button', { name: 'Done' }).click();
  await expect(page.locator('h1 span').first()).toHaveText('3');
});

test('a claim made during an EPFO outage is sent when EPFO is back', async ({ page }) => {
  await signIn(page);
  await page.getByRole('button', { name: 'Profile' }).click();
  await page.getByRole('switch', { name: 'Simulate EPFO outage' }).click();
  await page.goto('/#/epf');
  await expect(page.getByText('EPFO isn’t responding right now')).toBeVisible();
  await page.getByRole('button', { name: 'Withdraw from PF' }).click();
  await sheet(page).getByLabel('Amount in ₹').fill('25000');
  await sheet(page).getByRole('button', { name: 'Save and submit later' }).click();
  await expect(page.getByText('Claim saved. It’ll be submitted when EPFO is back.')).toBeVisible();

  // the queue survives a reload
  await page.reload();
  await page.getByRole('button', { name: 'Requests' }).click();
  await expect(page.getByText('Queued')).toBeVisible();

  await page.getByRole('button', { name: 'Profile' }).click();
  await page.getByRole('switch', { name: 'Simulate EPFO outage' }).click();
  await expect(page.getByText('EPFO is back. 1 queued request was submitted.')).toBeVisible();
  await page.getByRole('button', { name: 'Requests' }).click();
  await expect(page.getByText('Queued')).toHaveCount(0);
});

test('share a document, then revoke the code', async ({ page }) => {
  await signIn(page);
  await page.goto('/#/docs');
  await page.getByRole('button', { name: /PAN card/ }).click();
  await sheet(page).getByRole('button', { name: 'Share' }).click();
  await sheet(page).getByRole('button', { name: 'Create share code' }).click();
  await expect(sheet(page).getByRole('heading', { name: 'Share code ready' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(sheet(page)).toHaveCount(0);
  await page.getByRole('button', { name: 'Revoke' }).click();
  await expect(page.getByText('None yet.', { exact: false })).toBeVisible();
});

test('allow a records request and it leaves the home queue', async ({ page }) => {
  await signIn(page);
  await page.getByRole('button', { name: /wants to see your records/ }).click();
  await page.getByRole('button', { name: 'Allow for 7 days' }).click();
  await expect(page.getByText('Allowed', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Back' }).click();
  await expect(page.getByRole('button', { name: /wants to see your records/ })).toHaveCount(0);
});

test('search in Hindi and switch the language', async ({ page }) => {
  await signIn(page);
  await page.getByRole('button', { name: 'Services', exact: true }).click();
  await page.getByLabel('Search services').fill('चालान');
  await page.getByRole('button', { name: /Pay a traffic challan/ }).click();
  await expect(page).toHaveURL(/#\/vehicle$/);
  await page.getByRole('button', { name: 'Profile' }).click();
  await page.getByRole('button', { name: 'हिन्दी' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'hi');
  await expect(page.getByRole('button', { name: 'होम' })).toBeVisible();
});

test('keyboard: skip link reaches the main content and the sheet keeps focus', async ({ page }) => {
  await signIn(page);
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Skip to content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main')).toBeFocused();
  await page.getByRole('button', { name: /Track claim/ }).click();
  // Tab never reaches the page behind a modal sheet (it may pass through the browser's own UI).
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press('Tab');
    const where = await page.evaluate(() => (document.activeElement?.closest('dialog') ? 'sheet' : document.activeElement === document.body ? 'browser' : 'page'));
    expect(where).not.toBe('page');
  }
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: /Track claim/ })).toBeFocused();
});
