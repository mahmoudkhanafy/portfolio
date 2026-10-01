import { gzipSync } from 'node:zlib';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { works } from './helpers.ts';

const slug = works[0]!.slug;

test('opens in English at the root and in Arabic under ar/, site and link preview alike', async ({ page }) => {
  for (const [path, lang, dir, locale, image] of [['', 'en', 'ltr', 'en_US', 'og-home-en.jpg'], ['ar/', 'ar', 'rtl', 'ar_EG', 'og-home-ar.jpg']] as const) {
    await page.goto(path);
    await expect(page.locator('html')).toHaveAttribute('lang', lang);
    await expect(page.locator('html')).toHaveAttribute('dir', dir);
    await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute('content', locale);
    // Versioned by content (?v=), so an app that cached an older card fetches the new one.
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', new RegExp(`/mahmoud-khaled/${image.replace('.', '\\.')}\\?v=[0-9a-f]{10}$`));
  }
});

test('the language switch keeps the same video', async ({ page }) => {
  await page.goto(`work/${slug}/`);
  await page.getByRole('link', { name: 'اقرأ الموقع باللغة العربية' }).first().click();
  await expect(page).toHaveURL(new RegExp(`/mahmoud-khaled/ar/work/${slug}/$`));
  await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
  await page.getByRole('link', { name: 'Read this site in English' }).first().click();
  await expect(page).toHaveURL(new RegExp(`/mahmoud-khaled/work/${slug}/$`));
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test('links shared without the trailing slash or with app tracking still open', async ({ page, baseURL }) => {
  const plain = await page.goto(`ar/work/${slug}`);
  expect(plain?.status()).toBe(200);
  await expect(page).toHaveURL(new RegExp(`/work/${slug}/$`));
  await page.goto(`ar/work/${slug}/?utm_source=ig_web_copy_link&fbclid=abc`);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', new URL(`ar/work/${slug}/`, baseURL).href);
});

test('unknown addresses get a helpful bilingual 404, English first', async ({ page }) => {
  const response = await page.goto('work/does-not-exist/');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText("This page doesn't exist");
  await expect(page.getByRole('heading', { name: 'الصفحة دي مش موجودة' })).toBeVisible();
  await expect(page.getByRole('link', { name: "Back to Mahmoud's work" })).toHaveAttribute('href', '/mahmoud-khaled/');
  await expect(page.getByRole('link', { name: 'ارجع لشغل محمود' })).toHaveAttribute('href', '/mahmoud-khaled/ar/');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
});

test('search engines and phones get robots, sitemap, contact card and manifest', async ({ request, baseURL }) => {
  const robots = await (await request.get('robots.txt')).text();
  expect(robots).toContain(`Sitemap: ${new URL('sitemap-index.xml', baseURL).href}`);
  const sitemap = await (await request.get('sitemap-0.xml')).text();
  for (const work of works) {
    expect(sitemap).toContain(new URL(`work/${work.slug}/`, baseURL).href);
    expect(sitemap).toContain(new URL(`ar/work/${work.slug}/`, baseURL).href);
  }
  // The same language codes as each page's hreflang links.
  expect(sitemap).toContain('hreflang="en"');
  expect(sitemap).toContain('hreflang="ar"');

  const card = await request.get('mahmoud-khaled.vcf');
  expect(card.headers()['content-type']).toContain('text/vcard');
  const vcf = await card.text();
  expect(vcf).toContain('TEL;TYPE=CELL,VOICE:+201156379179');
  expect(vcf).toContain('EMAIL;TYPE=INTERNET:mahmoud.kh.hanafy@gmail.com');

  const manifest = await (await request.get('manifest.webmanifest')).json();
  expect(manifest).toMatchObject({ start_url: '/mahmoud-khaled/', lang: 'en', dir: 'ltr' });
});

for (const path of ['ar/', '', `ar/work/${slug}/`]) {
  test(`points each arrow the way its line reads, also where :dir() is unknown (${path || 'home'})`, async ({ page }) => {
    await page.goto(path);
    /** For each arrow on screen: whether it is mirrored, and whether its line reads right to left. A
        hidden arrow has no box, and so no transform to read. */
    const arrows = () =>
      page.locator('.icon--flip-rtl').evaluateAll((els) =>
        els.filter((el) => el.getClientRects().length > 0).map((el) => ({ mirrored: getComputedStyle(el).transform !== 'none', rtl: el.closest('[dir]')?.getAttribute('dir') === 'rtl' })),
      );
    const expected = (found: Array<{ rtl: boolean }>) => found.map(({ rtl }) => ({ mirrored: rtl, rtl }));
    const found = await arrows();
    expect(found.length).toBeGreaterThan(0);
    expect(found).toEqual(expected(found));
    // Safari before 16.4 (iOS 15 and 16.0–16.3) and Chrome before 120 drop every rule that uses :dir().
    await page.evaluate(() => {
      const drop = (rules: CSSRuleList, owner: CSSStyleSheet | CSSGroupingRule) => {
        for (let i = rules.length - 1; i >= 0; i--) {
          const rule = rules[i]!;
          if (rule instanceof CSSStyleRule && rule.selectorText.includes(':dir(')) owner.deleteRule(i);
          else if (rule instanceof CSSGroupingRule) drop(rule.cssRules, rule);
        }
      };
      for (const sheet of document.styleSheets) drop(sheet.cssRules, sheet);
    });
    expect(await arrows()).toEqual(expected(found));
  });
}

test('carries its <head> script on every page without comments, in little more than a kilobyte', async ({ request }) => {
  const html = await (await request.get('ar/')).text();
  const script = /<script>([\s\S]*?)<\/script>/.exec(html.slice(0, html.indexOf('</head>')))?.[1] ?? '';
  expect(script).toContain('pagereveal');
  expect(script).not.toMatch(/^\s*\/\//m);
  // A video page's HTML fits the first round trip of a slow phone connection (about 14.6 KB compressed).
  expect(gzipSync(script).length).toBeLessThan(1_300);
});

test('writes the script every page runs into the page, so first paint waits on no other file', async ({ request }) => {
  const html = await (await request.get('ar/')).text();
  // Astro writes a page's script in when it is small and imports nothing; the language offer
  // (src/scripts/language.js) is added only once the page has loaded.
  expect(html).not.toMatch(/<script type="module" src="[^"]*Base\.astro/);
  expect(html).toMatch(/script\.src = '[^']*\/_astro\/language\.[\w-]+\.js'/);
});

test('keeps its own paper design under Dark Reader', async ({ page }) => {
  await page.goto('ar/');
  await expect(page.locator('meta[name="darkreader-lock"]')).toHaveCount(1);
  await expect(page.locator('meta[name="color-scheme"]')).toHaveAttribute('content', 'light');
});

test('share buttons appear where the browser can share or copy', async ({ page, browserName, context }) => {
  test.skip(browserName !== 'chromium', 'Clipboard permission is granted per browser.');
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto(`ar/work/${slug}/`);
  const share = page.locator('.work__cta button[data-share]');
  await expect(share).toBeVisible();
  await page.evaluate(() => Object.defineProperty(navigator, 'share', { value: undefined }));
  await share.click();
  await expect(page.locator('#announcer')).toHaveText('اتنسخ اللينك');
});

for (const path of ['ar/', '', `ar/work/${slug}/`, `work/${slug}/`, 'work/missing/']) {
  test(`${path || 'home'} has no serious accessibility problems`, async ({ page }) => {
    await page.goto(path);
    // Check the page as it rests, not halfway through a build.
    await page.waitForFunction(() => [...document.querySelectorAll('.w, .pop')].every((el) => el.getAnimations().every((a) => a.playState !== 'running')));
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
    const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
  });
}
