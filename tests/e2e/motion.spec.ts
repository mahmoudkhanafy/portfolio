import { expect, test, type Page } from '@playwright/test';
import { works } from './helpers.ts';

const ORANGE = 'rgb(168, 57, 29)';

/** Waits until every animation inside `scope` has finished (a scope that has not built has none). */
const settled = (page: Page, scope: string) =>
  expect
    .poll(() => page.locator(scope).first().evaluate((el) => el.getAnimations({ subtree: true }).every((a) => a.playState === 'finished')), { timeout: 8_000 })
    .toBe(true);
const delaysOf = (page: Page, selector: string) => page.locator(selector).evaluateAll((els) => els.map((el) => parseFloat(getComputedStyle(el).animationDelay)));

test.describe('the hero line', () => {
  const lines = [
    { path: 'ar/', count: 7, keys: ['حكايتك.'], text: 'كل لقطة ليها حكاية. خلّينا نحكي حكايتك.' },
    { path: '', count: 8, keys: ['yours.'], text: "Every frame has a story. Let's tell yours." },
  ];
  for (const { path, count, keys, text } of lines) {
    test(`builds word by word as the name wipes in, its key word orange, and ends whole (${path || 'en'})`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator('html')).toHaveClass(/\bmotion\b/);
      const words = page.locator('.hero__lead .w');
      await expect(words).toHaveCount(count);
      const delays = await delaysOf(page, '.hero__lead .w');
      expect(delays[0]).toBeCloseTo(1.15, 2);
      expect(delays).toEqual([...delays].sort((a, b) => a - b));
      expect(delays.at(-1)!).toBeLessThanOrEqual(3.35);
      await settled(page, '.hero__lead');
      expect(await words.evaluateAll((els) => els.map((el) => getComputedStyle(el).opacity))).toEqual(Array(count).fill('1'));
      await expect(page.locator('.hero__lead .w--key')).toHaveText(keys);
      expect(await page.locator('.hero__lead .w--key').evaluateAll((els) => els.map((el) => getComputedStyle(el).color))).toEqual(keys.map(() => ORANGE));
      await expect(page.locator('.hero__lead .words')).toHaveAttribute('aria-hidden', 'true');
      await expect(page.locator('.hero__lead .words__read')).toHaveText(text);
    });
  }

  test('moves nothing on the page while it builds', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Layout shifts are measured by Chromium.');
    await page.goto('ar/');
    const shift = await page.evaluate(
      () =>
        new Promise<number>((resolve) => {
          let total = 0;
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries() as Array<PerformanceEntry & { value: number; hadRecentInput: boolean }>) if (!entry.hadRecentInput) total += entry.value;
          }).observe({ type: 'layout-shift', buffered: true });
          setTimeout(() => resolve(total), 4_000);
        }),
    );
    expect(shift).toBe(0);
  });

  test('lets "See the work" cue only once the line has built', async ({ page }) => {
    await page.goto('ar/');
    expect(await page.locator('.hero__cue svg').evaluate((el) => parseFloat(getComputedStyle(el).animationDelay))).toBeGreaterThanOrEqual(3.5);
  });

  test('stretches «حكايتك» with kashida and relaxes it, moving nothing', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Layout shifts are measured by Chromium.');
    await page.goto('ar/');
    const shift = page.evaluate(
      () =>
        new Promise<number>((resolve) => {
          let total = 0;
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries() as Array<PerformanceEntry & { value: number; hadRecentInput: boolean }>) if (!entry.hadRecentInput) total += entry.value;
          }).observe({ type: 'layout-shift', buffered: true });
          setTimeout(() => resolve(total), 4_500);
        }),
    );
    await page.waitForFunction(() => document.querySelector('.hero__lead .w__stretch')?.textContent?.includes('\u0640'), null, { timeout: 5_000 });
    await expect(page.locator('.hero__lead .w.is-stretching')).toHaveCount(1);
    await expect(page.locator('.hero__lead .w__stretch')).toHaveCount(0, { timeout: 3_000 });
    await expect(page.locator('.hero__lead .is-stretching')).toHaveCount(0);
    expect(await shift).toBe(0);
  });

  test('stretches nothing in English', async ({ page }) => {
    await page.goto('');
    await expect(page.locator('.hero__lead [data-kashida]')).toHaveCount(0);
  });
});

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('shows every word at once, unanimated', async ({ page }) => {
    for (const path of ['', `ar/work/${works[0]!.slug}/`]) {
      await page.goto(path);
      await expect(page.locator('html')).not.toHaveClass(/\bmotion\b/);
      const states = await page.locator('.w, .pop').evaluateAll((els) => els.map((el) => `${getComputedStyle(el).opacity}/${el.getAnimations().length}`));
      expect(states.filter((state) => state !== '1/0'), path || 'home').toEqual([]);
    }
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('shows every word at once', async ({ page }) => {
    await page.goto('ar/');
    await expect(page.locator('html')).not.toHaveClass(/\bmotion\b/);
    await expect(page.locator('.hero__lead .w').first()).toHaveCSS('opacity', '1');
    await expect(page.locator('.hero__lead .w').last()).toHaveCSS('opacity', '1');
  });
});

test.describe('headings, titles and services', () => {
  test('build as they come into view', async ({ page }) => {
    await page.goto('ar/');
    const heading = page.locator('#about-heading');
    await expect(heading).not.toHaveClass(/is-(built|building)/);
    await expect(heading.locator('.w').first()).toHaveCSS('opacity', '0');
    await heading.evaluate((el) => el.scrollIntoView({ block: 'center' }));
    await expect(heading).toHaveClass(/is-building/);
    await expect(heading.locator('.w').first()).toHaveCSS('opacity', '1');

    const services = page.locator('.about__list');
    await services.evaluate((el) => el.scrollIntoView({ block: 'center' }));
    await expect(services).toHaveClass(/is-building/);
    expect(await delaysOf(page, '.about__list li')).toEqual([0, 0.17, 0.34, 0.51]);
    await settled(page, '.about__list');
    const items = await services.locator('li').evaluateAll((els) => els.map((el) => [getComputedStyle(el).opacity, getComputedStyle(el, '::after').transform]));
    for (const [opacity, rule] of items) expect([opacity, rule === 'none' || rule === 'matrix(1, 0, 0, 1, 0, 0)']).toEqual(['1', true]);

    const contact = page.locator('#contact-heading');
    await contact.evaluate((el) => el.scrollIntoView({ block: 'center' }));
    await settled(page, '#contact-heading');
    await expect(contact.locator('.w--key')).toHaveText(['صورة.']);
    await expect(contact).toHaveAccessibleName('عندك فكرة؟ نخلّيها صورة.');
  });

  test('show at once what is already on screen as the page starts', async ({ page }) => {
    await page.goto('ar/#about');
    await expect(page.locator('#about-heading')).toHaveClass(/is-built/);
    expect(await page.locator('#about-heading .w').first().evaluate((el) => el.getAnimations().length)).toBe(0);
  });

  test('build a feed title word by word, its arrow last', async ({ page }) => {
    const work = works[0]!;
    await page.goto('ar/');
    const title = page.locator(`#title-${work.slug}`);
    await title.evaluate((el) => el.scrollIntoView({ block: 'center' }));
    await expect(title).toHaveClass(/is-building/);
    const delays = await delaysOf(page, `#title-${work.slug} .w`);
    expect(delays[0]).toBe(0);
    expect(delays).toEqual([...delays].sort((a, b) => a - b));
    await expect(title.locator('.w').last().locator('.reel__go')).toHaveCount(1);
    await settled(page, `#title-${work.slug}`);
    await expect(title).toHaveAccessibleName(work.title.ar);
  });

  test('show a title that comes to rest whole at the bottom of the screen', async ({ page }) => {
    await page.goto('ar/');
    await page.waitForFunction(() => document.documentElement.classList.contains('motion-ready'));
    await page.waitForTimeout(300);
    const title = page.locator(`#title-${works[1]!.slug}`);
    // Stop with the title whole, just above the bottom edge: below the line where text scrolling in starts to build.
    await title.evaluate((el) => window.scrollBy({ top: el.getBoundingClientRect().bottom - innerHeight + 4, behavior: 'instant' }));
    expect(await title.evaluate((el) => el.getBoundingClientRect().top > innerHeight * 0.85), 'the title rests in the bottom 15%').toBe(true);
    await expect(title).toHaveClass(/is-building/);
    await expect(title.locator('.w').first()).toHaveCSS('opacity', '1');
  });

  test('keep each title’s arrow beside its last word, never on a line of its own', async ({ page }) => {
    for (const width of [342, 372, 390, 408, 816, 834, 1024, 1280, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('ar/');
      // Plain line breaking, as where headings are not balanced (Safari on some iPads).
      await page.addStyleTag({ content: '.reel__title { text-wrap: wrap !important; }' });
      const alone = await page.locator('.reel__title').evaluateAll((titles) =>
        titles
          .filter((title) => {
            const words = [...title.querySelectorAll('.w')];
            const arrow = words.pop()!.getBoundingClientRect();
            const last = words.pop()!.getBoundingClientRect();
            // On the same line: the arrow's middle lies within the last word's lines.
            const middle = arrow.top + arrow.height / 2;
            return middle < last.top || middle > last.bottom;
          })
          .map((title) => title.id),
      );
      expect(alone, `${width}px`).toEqual([]);
    }
  });

  test('show a title as soon as keyboard focus reaches it, wherever it is', async ({ page }) => {
    await page.goto('ar/');
    const title = page.locator(`#title-${works.at(-1)!.slug}`);
    // Focus without scrolling, so only the focus can start the build (not coming into view).
    const before = await page.evaluate(() => scrollY);
    await title.locator('a').evaluate((el) => (el as HTMLElement).focus({ preventScroll: true }));
    expect(await page.evaluate(() => scrollY)).toBe(before);
    await expect(title).toHaveClass(/is-building/);
    await expect(title.locator('.w').first()).toHaveCSS('opacity', '1');
  });

  test('show everything plainly if the motion script never starts', async ({ page }) => {
    // It does start here, so take its mark away the moment it appears, as if it never had.
    await page.addInitScript(() => {
      new MutationObserver(() => {
        // Only when present: removing a missing class still rewrites the attribute and would loop.
        const root = document.documentElement;
        if (root?.classList.contains('motion-ready')) root.classList.remove('motion-ready');
      }).observe(document, { subtree: true, attributes: true, attributeFilter: ['class'] });
    });
    await page.goto('ar/');
    await expect(page.locator('#about-heading .w').first()).toHaveCSS('opacity', '0');
    // The <head> script gives it 4 s, then shows the text plain.
    await expect(page.locator('html')).not.toHaveClass(/\bmotion\b/, { timeout: 6_000 });
    await expect(page.locator('#about-heading .w').first()).toHaveCSS('opacity', '1');
  });

  test('build a title pasted with markup, emoji, hashtags and links, and read it whole', async ({ page }) => {
    const edge = works.find((w) => w.slug === 'edge-case-text');
    expect(edge, 'the e2e build adds tests/fixtures/work/ (npm run build:e2e)').toBeDefined();
    for (const [path, text] of [['ar/', edge!.title.ar], ['', edge!.title.en!]] as const) {
      await page.goto(path);
      const title = page.locator(`#title-${edge!.slug}`);
      await title.evaluate((el) => el.scrollIntoView({ block: 'center' }));
      await expect(title).toHaveClass(/is-building/);
      await settled(page, `#title-${edge!.slug}`);
      await expect(title).toHaveAccessibleName(text);
      expect(new Set(await title.locator('.w').evaluateAll((els) => els.map((el) => getComputedStyle(el).opacity)))).toEqual(new Set(['1']));
      await expect(page.locator('main b, main img[src="x"]')).toHaveCount(0);
    }
  });
});

test.describe('a video page', () => {
  test('builds its title once the frame has landed, and is read whole', async ({ page }) => {
    const work = works[0]!;
    await page.goto(`ar/work/${work.slug}/`);
    expect((await delaysOf(page, '#work-title .w'))[0]).toBeCloseTo(0.65, 2);
    await settled(page, '#work-title');
    await expect(page.locator('#work-title')).toHaveAccessibleName(work.title.ar);
  });
});

test.describe('a page the browser translates', () => {
  // A translator writes its own words into the word spans, which keep the page's direction, so a
  // translated line would read backwards: each line shows its whole copy instead, as one sentence.
  const lines = ['.hero__lead', '#contact-heading', `#title-${works[0]!.slug}`];
  const whole = (page: Page, line: string) =>
    page.locator(line).evaluate((el) => {
      const copy = el.querySelector('.words__read')!.getBoundingClientRect();
      const words = [...el.querySelectorAll('.words .w:not(.w--trail)')].filter((w) => w.getClientRects().length > 0);
      return { copy: copy.width > 20 && copy.height > 10, words: words.length };
    });

  test('shows each line whole once Chrome marks the page translated, a title’s arrow still after it', async ({ page }) => {
    await page.goto('ar/');
    await page.evaluate(() => document.documentElement.classList.add('translated-ltr'));
    for (const line of lines) expect(await whole(page, line), line).toEqual({ copy: true, words: 0 });
    await expect(page.locator(`#title-${works[0]!.slug} .reel__go`)).toBeVisible();
  });

  test('shows each line whole when any other translator rewrites the words, but not for the kashida', async ({ page, browserName }) => {
    await page.goto('ar/');
    if (browserName === 'chromium') {
      await page.waitForFunction(() => document.querySelector('.hero__lead .w__stretch'), null, { timeout: 5_000 });
      await expect(page.locator('.hero__lead .w__stretch')).toHaveCount(0, { timeout: 3_000 });
    }
    await settled(page, '.hero__lead');
    await expect(page.locator('html')).not.toHaveClass(/\btranslated\b/);
    await page.locator('.hero__lead .w').first().evaluate((el) => void ((el.firstChild as Text).data = 'Reels'));
    await expect(page.locator('html')).toHaveClass(/\btranslated\b/);
    for (const line of lines) expect(await whole(page, line), line).toEqual({ copy: true, words: 0 });
  });
});
