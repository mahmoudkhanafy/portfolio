import { expect, test } from '@playwright/test';
import { watchForProblems, works } from './helpers.ts';

test.describe('home page', () => {
  test('introduces Mahmoud in Arabic, right to left, with every piece of work', async ({ page }) => {
    const problems = watchForProblems(page);
    await page.goto('');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('محمود خالد');
    await expect(page.locator('[data-reel]')).toHaveCount(works.length);
    for (const work of works) await expect(page.locator(`#title-${work.slug}`)).toHaveAccessibleName(work.title.ar);
    expect(problems).toEqual([]);
  });

  test('offers WhatsApp first, with a message already written', async ({ page }) => {
    await page.goto('');
    const cta = page.locator('.hero').getByRole('link', { name: 'كلّمني على واتساب' });
    const href = await cta.getAttribute('href');
    expect(href).toMatch(/^https:\/\/wa\.me\/201156379179\?text=/);
    expect(new URL(href!).searchParams.get('text')).toMatch(/^أهلاً يا محمود/);
  });

  test('has an English version, left to right', async ({ page }) => {
    const problems = watchForProblems(page);
    await page.goto('en/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Mahmoud Khaled');
    await expect(page.locator('[data-reel]')).toHaveCount(works.length);
    expect(problems).toEqual([]);
  });

  for (const width of [320, 390]) {
    // Every page, including the e2e build's test piece whose titles hold long unbroken hashtags and links.
    test(`fits a ${width} px phone without sideways scrolling, whatever the titles say`, async ({ page }) => {
      await page.setViewportSize({ width, height: 740 });
      for (const path of ['', 'en/', ...works.flatMap((w) => [`work/${w.slug}/`, `en/work/${w.slug}/`])]) {
        await page.goto(path);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(overflow, path).toBeLessThanOrEqual(0);
      }
    });
  }

  for (const path of ['', 'en/']) {
    // A name that wraps doubles the gold caption and covers his face; "Mahmoud Khaled" is 1.5× wider than "محمود خالد".
    test(`keeps the name in the lower third on one line, clear of his face (${path || 'ar'})`, async ({ page }) => {
      for (const [width, height] of [[320, 640], [390, 844], [768, 1024], [1024, 768], [1280, 720], [1440, 900], [1920, 1080]] as const) {
        await page.setViewportSize({ width, height });
        await page.goto(path);
        await page.evaluate(() => document.fonts.ready);
        const { lines, covered } = await page.evaluate(() => {
          const range = document.createRange();
          range.selectNodeContents(document.querySelector('.hero__name')!);
          const third = document.querySelector('.hero__third')!.getBoundingClientRect();
          const portrait = document.querySelector('.hero__portrait img')!.getBoundingClientRect();
          return {
            lines: new Set([...range.getClientRects()].map((r) => Math.round(r.top))).size,
            covered: (portrait.bottom - third.top) / portrait.height,
          };
        });
        expect(lines, `${width}×${height}`).toBe(1);
        expect(covered, `${width}×${height}: share of the portrait under the caption`).toBeLessThan(0.5);
      }
    });
  }

  test('stays light on first load (no video, small JavaScript)', async ({ page }) => {
    const sizes: Array<{ url: string; bytes: number; type: string }> = [];
    page.on('requestfinished', async (request) => {
      const response = await request.response();
      const { responseBodySize } = await request.sizes();
      sizes.push({ url: request.url(), bytes: responseBodySize, type: response?.headers()['content-type'] ?? '' });
    });
    await page.goto('', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    expect(sizes.filter((s) => s.type.startsWith('video/'))).toEqual([]);
    const total = sizes.reduce((sum, s) => sum + s.bytes, 0);
    const js = sizes.filter((s) => s.type.includes('javascript')).reduce((sum, s) => sum + s.bytes, 0);
    expect(total, JSON.stringify(sizes.map((s) => [s.url.split('/').pop(), s.bytes]))).toBeLessThan(400_000);
    expect(js).toBeLessThan(12_000);
  });
});

test.describe('"See the work"', () => {
  const cueAnimation = (page: import('@playwright/test').Page) =>
    page.locator('.hero__next-cue svg').evaluate((el) => {
      const style = getComputedStyle(el);
      return { name: style.animationName, count: style.animationIterationCount, delay: parseFloat(style.animationDelay) };
    });

  test('cues the way down after the lower third lands, a few times, then rests', async ({ page }) => {
    await page.goto('');
    const cue = await cueAnimation(page);
    expect(cue.name).not.toBe('none');
    expect(cue.count).not.toBe('infinite');
    expect(cue.delay).toBeGreaterThanOrEqual(1);
  });

  test('eases down to the work', async ({ page }) => {
    await page.goto('');
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe('smooth');
    await page.locator('.hero__next').click();
    await expect(page).toHaveURL(/#work$/);
    await expect.poll(() => page.locator('#work-heading').evaluate((el) => Math.round(el.getBoundingClientRect().top))).toBeLessThan(160);
  });

  test('draws its underline from the reading start on hover', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Hover is for mouse users.');
    for (const [path, edge] of [['', /^100%, 100%$/], ['en/', /^0(%|px), 0(%|px)$/]] as const) {
      await page.goto(path);
      const label = page.locator('.hero__next-label');
      expect(await label.evaluate((el) => getComputedStyle(el).backgroundPositionX)).toMatch(edge);
      await page.locator('.hero__next').hover();
      await expect.poll(() => label.evaluate((el) => getComputedStyle(el).backgroundSize)).toBe('100% 1px, 100% 1px');
    }
  });

  test.describe('with reduced motion', () => {
    test.use({ reducedMotion: 'reduce' });

    test('stays still and jumps straight to the work', async ({ page }) => {
      await page.goto('');
      expect((await cueAnimation(page)).name).toBe('none');
      expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe('auto');
    });
  });
});
