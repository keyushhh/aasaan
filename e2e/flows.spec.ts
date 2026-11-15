import { expect, test, type Page } from '@playwright/test';

/** Onboarding, happy path: number, SMS from SIM 1, records found, it's me, face check, link all, PIN on the keypad, home. */
async function signIn(page: Page) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole('button', { name: 'Get started' }).click();
  await page.getByLabel('Mobile number').fill('12345');
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('alert')).toHaveText('Enter a valid 10-digit mobile number.');
  await page.getByLabel('Mobile number').fill('9876543210');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Send SMS' }).click();
  await expect(page.getByText('Found records in 5 places')).toBeVisible({ timeout: 10000 });
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Yes, this is me' }).click();
  await page.getByRole('button', { name: 'Start face check' }).click();
  await page.getByRole('button', { name: 'Continue' }).click({ timeout: 10000 });
  await page.getByRole('button', { name: 'Link and continue' }).click();
  await page.keyboard.type('1234');
  await expect(page.getByRole('heading', { name: 'Enter it again' })).toBeVisible();
  await page.getByRole('button', { name: '1', exact: true }).click();
  await page.getByRole('button', { name: '2', exact: true }).click();
  await page.getByRole('button', { name: '3', exact: true }).click();
  await page.getByRole('button', { name: '4', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Unlock with fingerprint or face' })).toBeVisible();
  // headless browsers have no fingerprint or face unlock, so the screen says so and moves on
  await page.getByRole('button', { name: /^(Continue|Not now)$/ }).click();
  await page.getByRole('button', { name: 'Go to home' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('things need you');
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

  // the queue survives a reload (which asks for the app PIN)
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Welcome back, Ananya' })).toBeVisible();
  await page.keyboard.type('1234');
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
  await page.getByRole('searchbox', { name: 'Search services' }).fill('चालान');
  await page.getByRole('button', { name: /Pay a traffic challan/ }).click();
  await expect(page).toHaveURL(/#\/vehicle$/);
  await page.getByRole('button', { name: 'Profile' }).click();
  await page.getByRole('button', { name: /^Language/ }).click();
  await page.getByRole('radio', { name: /हिन्दी/ }).check();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await page.getByRole('button', { name: 'Save changes' }).click();
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

test('change the mobile number and email everywhere at once, with one department down', async ({ page }) => {
  await signIn(page);
  await page.getByRole('button', { name: 'Profile' }).click();
  await page.getByRole('switch', { name: 'Simulate Parivahan outage' }).click();
  await page.getByRole('button', { name: /^Mobile number/ }).click();
  await sheet(page).getByLabel('New mobile number').fill('9876543210');
  await sheet(page).getByRole('button', { name: 'Get OTP' }).click();
  await expect(sheet(page).getByRole('alert')).toHaveText('That’s already your number. Enter the new one.');
  await sheet(page).getByLabel('New mobile number').fill('9123456780');
  await sheet(page).getByRole('button', { name: 'Get OTP' }).click();
  await sheet(page).getByLabel('6-digit OTP').fill('123456');
  await sheet(page).getByRole('button', { name: 'Verify' }).click();
  await sheet(page).getByRole('button', { name: 'Update 6 places' }).click();
  await expect(sheet(page).getByRole('heading', { name: 'Your number is updated' })).toBeVisible();
  await expect(sheet(page).getByText('Updated', { exact: true })).toHaveCount(5);
  await expect(sheet(page).getByText('Saved, sends when Parivahan is back')).toBeVisible();
  await sheet(page).getByRole('button', { name: 'Done' }).click();
  await expect(page.getByRole('button', { name: /^Mobile number/ })).toContainText('+91 91••••••80');

  await page.getByRole('button', { name: /^Email/ }).click();
  await sheet(page).getByLabel('New email').fill('ananya.rao@example.com');
  await sheet(page).getByRole('button', { name: 'Get OTP' }).click();
  await sheet(page).getByLabel('6-digit OTP').fill('123456');
  await sheet(page).getByRole('button', { name: 'Verify' }).click();
  await sheet(page).getByRole('button', { name: 'Update 6 places' }).click();
  await expect(sheet(page).getByRole('heading', { name: 'Your email is updated' })).toBeVisible();
  await sheet(page).getByRole('button', { name: 'Done' }).click();
  await expect(page.getByRole('button', { name: /^Email/ })).toContainText('ananya.rao@example.com');
});

test('onboarding: the wrong SIM is caught, a mismatched PIN starts over, and relaunching asks for the PIN', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole('button', { name: 'Get started' }).click();
  await page.getByLabel('Mobile number').fill('9876543210');
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('button', { name: 'Get an OTP instead' })).toHaveCount(0);
  await page.getByRole('radio', { name: 'SIM 2' }).check();
  await page.getByRole('button', { name: 'Send SMS' }).click();
  await expect(page.getByText('SIM 2 has a different number. Pick the other SIM.')).toBeVisible({ timeout: 8000 });
  await page.getByRole('radio', { name: 'SIM 1' }).check();
  await page.getByRole('button', { name: 'Send SMS' }).click();
  await expect(page.getByText('Number verified')).toBeVisible({ timeout: 8000 });
  await expect(page.getByText('Found records in 5 places')).toBeVisible({ timeout: 10000 });
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'This isn’t me' }).click();
  await expect(page.getByText(/Aadhaar Seva Kendra/)).toBeVisible();
  await page.getByRole('button', { name: 'Change number' }).click();
  await expect(page.getByRole('heading', { name: 'What’s your mobile number?' })).toBeVisible();

  // relaunch after a full onboarding asks for the PIN on the keypad
  await signIn(page);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Welcome back, Ananya' })).toBeVisible();
  await page.keyboard.type('9999');
  await expect(page.getByRole('alert')).toHaveText('That PIN isn’t right. Try again.');
  await page.keyboard.type('1234');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('things need you');
});
