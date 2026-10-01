import { expect, test } from '@playwright/test';
import { watchForProblems, works } from './helpers.ts';

test.describe('home page', () => {
  test('introduces Mahmoud in Arabic, right to left, with every piece of work', async ({ page }) => {
    const problems = watchForProblems(page);
    await page.goto('ar/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName('محمود خالد');
    await expect(page.locator('[data-reel]')).toHaveCount(works.length);
    for (const work of works) await expect(page.locator(`#title-${work.slug}`)).toHaveAccessibleName(work.title.ar);
    expect(problems).toEqual([]);
  });

  test('offers WhatsApp first, with a message already written', async ({ page }) => {
    await page.goto('ar/');
    const cta = page.locator('.hero').getByRole('link', { name: 'كلّمني على واتساب' });
    const href = await cta.getAttribute('href');
    expect(href).toMatch(/^https:\/\/wa\.me\/201156379179\?text=/);
    expect(new URL(href!).searchParams.get('text')).toMatch(/^أهلاً يا محمود/);
  });

  test('has an English version, left to right', async ({ page }) => {
    const problems = watchForProblems(page);
    await page.goto('');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
    await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName('Mahmoud Khaled');
    await expect(page.locator('[data-reel]')).toHaveCount(works.length);
    expect(problems).toEqual([]);
  });

  for (const width of [320, 390]) {
    // Every page, including the e2e build's test piece whose titles hold long unbroken hashtags and links.
    test(`fits a ${width} px phone without sideways scrolling, whatever the titles say`, async ({ page }) => {
      await page.setViewportSize({ width, height: 740 });
      for (const path of ['ar/', '', ...works.flatMap((w) => [`ar/work/${w.slug}/`, `work/${w.slug}/`])]) {
        await page.goto(path);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(overflow, path).toBeLessThanOrEqual(0);
      }
    });
  }

  for (const path of ['ar/', '']) {
    // His first and last name each keep to one line, and the portrait on its orange block stays on screen,
    // measured once it has arrived: a finished entrance must leave the photo its full size.
    test(`sets the name on two whole lines beside his portrait (${path || 'en'})`, async ({ page }) => {
      for (const [width, height] of [[320, 640], [390, 844], [445, 800], [768, 1024], [1024, 768], [1280, 720], [1440, 900], [1920, 1080]] as const) {
        await page.setViewportSize({ width, height });
        await page.goto(path);
        await page.evaluate(() => Promise.all([document.fonts.ready, ...document.querySelector('.hero__portrait')!.getAnimations().map((a) => a.finished)]));
        const { lines, name, art, photo } = await page.evaluate(() => {
          const lineCount = (el: Element) => {
            const range = document.createRange();
            range.selectNodeContents(el);
            return new Set([...range.getClientRects()].map((r) => Math.round(r.top))).size;
          };
          const rect = (el: Element) => el.getBoundingClientRect().toJSON() as DOMRect;
          return {
            lines: [...document.querySelectorAll('.hero__name > span')].map(lineCount),
            name: rect(document.querySelector('.hero__name')!),
            art: rect(document.querySelector('.hero__art')!),
            photo: rect(document.querySelector('.hero__portrait img')!),
          };
        });
        expect(lines, `${width}×${height}`).toEqual([1, 1]);
        expect([name.left >= 0, name.right <= width], `${width}×${height}: the name inside the screen`).toEqual([true, true]);
        expect([art.left >= 0, art.right <= width, art.width > 100], `${width}×${height}: the portrait on screen`).toEqual([true, true, true]);
        const shown = Math.min(photo.bottom, art.bottom) - Math.max(photo.top, art.top);
        expect(shown / art.height, `${width}×${height}: his photo fills its block`).toBeGreaterThan(0.75);
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
    await page.goto('ar/', { waitUntil: 'networkidle' });
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
    page.locator('.hero__cue svg').evaluate((el) => {
      const style = getComputedStyle(el);
      return { name: style.animationName, count: style.animationIterationCount, delay: parseFloat(style.animationDelay) };
    });

  test('cues the way down once the hero has built, a few times, then rests', async ({ page }) => {
    await page.goto('ar/');
    const cue = await cueAnimation(page);
    expect(cue.name).not.toBe('none');
    expect(cue.count).not.toBe('infinite');
    expect(cue.delay).toBeGreaterThanOrEqual(1);
  });

  test('eases down to the work', async ({ page }) => {
    await page.goto('ar/');
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe('smooth');
    await page.locator('.hero__next').click();
    await expect(page).toHaveURL(/#work$/);
    await expect.poll(() => page.locator('#work-heading').evaluate((el) => Math.round(el.getBoundingClientRect().top))).toBeLessThan(160);
  });

  test('drops its arrow again on hover', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Hover is for mouse users.');
    await page.goto('ar/');
    await page.locator('.hero__next').hover();
    await expect.poll(() => page.locator('.hero__cue svg').evaluate((el) => getComputedStyle(el).animationDuration)).toBe('1.1s');
  });

  test.describe('with reduced motion', () => {
    test.use({ reducedMotion: 'reduce' });

    test('stays still and jumps straight to the work', async ({ page }) => {
      await page.goto('ar/');
      expect((await cueAnimation(page)).name).toBe('none');
      expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe('auto');
    });
  });
});
