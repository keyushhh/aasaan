import { test, type Page } from '@playwright/test';
import path from 'node:path';

/** README screenshots of the app at 390x844, 2x. Output: docs/screenshots (then converted to WebP). */
const APP = 'http://localhost:5181/';
const OUT = path.resolve('docs/screenshots');
const NOW = new Date('2026-11-12T10:00:00+05:30');

async function signedIn(page: Page, theme: 'light' | 'dark') {
  await page.clock.setFixedTime(NOW);
  await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
  await page.goto(APP);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByLabel('Mobile number').fill('9876543210');
  await page.getByRole('button', { name: 'Get OTP' }).click();
  await page.getByLabel('6-digit OTP').fill('123456');
  await page.getByRole('button', { name: 'Verify' }).click();
  await page.getByRole('button', { name: 'Link and continue' }).click();
}
const settle = async (page: Page) => {
  await page.waitForTimeout(800);
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({ content: '[role=status] > * { display: none !important; }' });
};

const SHOTS: [string, 'light' | 'dark', (p: Page) => Promise<void>][] = [
  ['home-dark', 'dark', async () => {}],
  ['home-light', 'light', async () => {}],
  ['epf-dark', 'dark', async (p) => { await p.goto(APP + '#/epf'); }],
  ['vehicle-light', 'light', async (p) => { await p.goto(APP + '#/vehicle'); }],
  ['document-dark', 'dark', async (p) => { await p.goto(APP + '#/docs'); await p.waitForTimeout(600); await p.getByRole('button', { name: /Aadhaar/ }).click(); }],
  ['claim-light', 'light', async (p) => { await p.goto(APP + '#/epf'); await p.waitForTimeout(600); await p.getByRole('button', { name: 'Withdraw from PF' }).click(); }],
];

test.use({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
for (const [name, theme, go] of SHOTS) {
  test(name, async ({ page }) => {
    await signedIn(page, theme);
    await go(page);
    await settle(page);
    await page.screenshot({ path: `${OUT}/${name}.png` });
  });
}
