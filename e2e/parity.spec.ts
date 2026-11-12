import { test, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const REF = 'file://' + path.resolve('reference/index.html');
const APP = 'http://localhost:5181/';
const OUT = path.resolve('e2e/parity-shots');
const NOW = new Date('2026-11-12T10:00:00+05:30');
const SCREENS = (process.env.SCREENS ?? 'login,otp,link,home,services,requests,profile,epf,vehicle,docs,tax,health').split(',');

async function open(page: Page, base: string, theme: 'light' | 'dark') {
  await page.clock.setFixedTime(NOW);
  await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
  await page.goto(base);
  await page.evaluate(() => localStorage.clear());
  await page.goto(base);
}
const route = (base: string, r: string) => (base === REF ? `${REF}#${r}` : `${APP}#/${r}`);

/** A scenario is a screen, then button names to click in order: "epf>Withdraw from PF>Submit claim". "~Name" clicks a switch. */
async function reach(page: Page, base: string, scenario: string) {
  const [screen, ...clicks] = scenario.split('>');
  await reachScreen(page, base, screen);
  for (const c of clicks) {
    await page.waitForTimeout(600);
    if (c.startsWith('@')) await page.goto(route(base, c.slice(1)));
    else if (c.startsWith('~')) await page.getByRole('switch', { name: c.slice(1) }).click();
    else await page.getByRole('button', { name: c }).last().click();
  }
}

async function reachScreen(page: Page, base: string, screen: string) {
  if (screen === 'login') return;
  await page.locator('input').first().fill('9876543210');
  await page.getByRole('button', { name: 'Get OTP' }).click();
  if (screen === 'otp') return;
  await page.locator('input').first().fill('123456');
  await page.getByRole('button', { name: 'Verify' }).click();
  if (screen === 'link') return;
  await page.getByRole('button', { name: 'Link and continue' }).click();
  if (screen !== 'home') await page.goto(route(base, screen));
}

async function shot(page: Page, base: string, screen: string, theme: 'light' | 'dark') {
  await open(page, base, theme);
  await reach(page, base, screen);
  await page.waitForTimeout(900);
  await page.evaluate(() => document.fonts.ready);
  await page.mouse.move(0, 0);
  // Toasts are timed, so whether one is still up depends on test speed. Their copy is covered by the tests.
  await page.addStyleTag({ content: '#toast, [role=status] > * { display: none !important; }' });
  return page.screenshot({ fullPage: true });
}

for (const theme of ['light', 'dark'] as const) {
  for (const screen of SCREENS) {
    test(`${screen} ${theme}`, async ({ page, browser }) => {
      mkdirSync(OUT, { recursive: true });
      const ref = await shot(page, REF, screen, theme);
      const app = await shot(page, APP, screen, theme);
      const cmp = await browser.newPage({ viewport: { width: 820, height: 900 } });
      const src = (b: Buffer) => 'data:image/png;base64,' + b.toString('base64');
      await cmp.setContent(`<body style="margin:0;display:flex;gap:40px;background:#888;align-items:flex-start">
        <img src="${src(ref)}"><img src="${src(app)}"></body>`);
      await cmp.screenshot({ path: `${OUT}/${screen.replace(/[^a-z0-9]+/gi, '_')}-${theme}.png`, fullPage: true });
      const diff = await cmp.evaluate(async () => {
        const [a, b] = [...document.images];
        await Promise.all([a, b].map((i) => i.decode()));
        const px = (i: HTMLImageElement) => {
          const c = document.createElement('canvas');
          c.width = i.naturalWidth; c.height = i.naturalHeight;
          const x = c.getContext('2d')!; x.drawImage(i, 0, 0);
          return x.getImageData(0, 0, c.width, c.height);
        };
        const A = px(a), B = px(b);
        if (A.width !== B.width || A.height !== B.height) return `size ${A.width}x${A.height} vs ${B.width}x${B.height}`;
        let n = 0, minY = Infinity, maxY = -1;
        for (let i = 0; i < A.data.length; i += 4) {
          if (Math.abs(A.data[i] - B.data[i]) + Math.abs(A.data[i + 1] - B.data[i + 1]) + Math.abs(A.data[i + 2] - B.data[i + 2]) > 24) {
            n++; const y = Math.floor(i / 4 / A.width); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
          }
        }
        return (n ? `${n} px differ, rows ${minY}-${maxY}` : 'identical') + ` (${A.width}x${A.height})`;
      });
      console.log(`PARITY ${screen} ${theme}: ${diff}`);
      await cmp.close();
    });
  }
}
