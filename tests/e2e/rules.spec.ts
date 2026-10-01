import { expect, test, type Page } from '@playwright/test';
import { videoState, works } from './helpers.ts';

const pieceIn = (page: Page, slug: string) => page.locator('[data-reel]').filter({ has: page.locator(`#title-${slug}`) });

test.describe('play here, open there', () => {
  test('a picture plays where it is, and the page stays', async ({ page }) => {
    await page.goto('ar/');
    const url = page.url();
    await pieceIn(page, works[0]!.slug).locator('.player__play').click();
    await expect.poll(async () => (await videoState(page, '[data-reel] [data-player] >> nth=0')).time, { timeout: 15_000 }).toBeGreaterThan(0.3);
    expect(page.url()).toBe(url);
  });

  test('a title opens its page, and says so with an arrow that is not read out', async ({ page }) => {
    const work = works[1]!;
    await page.goto('ar/');
    const link = page.locator(`#title-${work.slug} a`);
    await expect(link).toHaveAccessibleName(work.title.ar);
    await expect(link.locator('[aria-hidden="true"] .reel__go')).toHaveCount(1);
    await link.click();
    await expect(page).toHaveURL(new RegExp(`/work/${work.slug}/$`));
  });

  test('nudges a title’s arrow on hover only where there is a mouse, so a tap on a phone opens the page at once', async ({ page }) => {
    await page.goto('ar/');
    const link = page.locator(`#title-${works[1]!.slug} a`);
    await link.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await link.hover();
    const mouse = await page.evaluate(() => matchMedia('(hover: hover)').matches);
    await expect
      .poll(() => link.locator('.reel__go').evaluate((el) => getComputedStyle(el).translate))
      // An Arabic title's arrow steps down its reading way, to the left.
      .toBe(mouse ? '-3px 3px' : 'none');
  });

  test('"All work" returns to the same piece, even the last one', async ({ page }) => {
    const work = works.at(-1)!;
    await page.goto(`ar/work/${work.slug}/`);
    await expect(page.locator('.work__back')).toHaveAttribute('href', new RegExp(`/#reel-${work.slug}$`));
    await page.locator('.work__back').click();
    await expect(page).toHaveURL(new RegExp(`#reel-${work.slug}$`));
    const viewport = page.viewportSize()!;
    await expect
      .poll(async () => {
        const top = (await pieceIn(page, work.slug).boundingBox())?.y ?? -1;
        return top >= 0 && top < viewport.height / 3;
      })
      .toBe(true);
  });
});

/** The frame pseudo-elements a paired glide animates (both sides named `frame`). */
const PAIRED = JSON.stringify(['::view-transition-group(frame)', '::view-transition-new(frame)', '::view-transition-old(frame)']);

test.describe('the glide', () => {
  test.beforeEach(async ({ page }) => {
    // Records, on each new page, what its view transition names and animates.
    await page.addInitScript(() => {
      addEventListener('pagereveal', (event) => {
        const transition = (event as Event & { viewTransition: ViewTransition | null }).viewTransition;
        if (!transition) return void sessionStorage.setItem('glide', 'none');
        transition.ready.then(
          () => {
            const named = [...document.querySelectorAll<HTMLElement>('body *')].filter((el) => getComputedStyle(el).viewTransitionName !== 'none');
            const frames = document
              .getAnimations()
              .map((a) => (a.effect as KeyframeEffect | null)?.pseudoElement ?? '')
              .filter((p) => p.includes('(frame)'));
            // Where the frame lands: it must be on screen, not where the piece was before a scroll.
            const rect = named[0]?.getBoundingClientRect();
            const onScreen = rect ? rect.bottom > 0 && rect.top < innerHeight : false;
            sessionStorage.setItem('glide', JSON.stringify({ named: named.map((el) => el.dataset.frame ?? el.tagName), frames: JSON.stringify([...new Set(frames)].sort()), onScreen }));
          },
          () => sessionStorage.setItem('glide', 'skipped'),
        );
      });
    });
  });
  const glide = (page: Page) => page.evaluate(() => sessionStorage.getItem('glide'));
  const expected = (slug: string) => JSON.stringify({ named: [slug], frames: PAIRED, onScreen: true });
  /** Lets the page render twice, then clears the record: WebKit sometimes skips a transition clicked for at once. */
  const settle = (page: Page) =>
    page.evaluate(
      () =>
        new Promise<void>((done) =>
          requestAnimationFrame(() =>
            requestAnimationFrame(() => {
              sessionStorage.removeItem('glide');
              done();
            }),
          ),
        ),
    );
  const open = async (page: Page, path: string) => {
    await page.goto(path);
    await settle(page);
  };

  test('moves only the opened piece’s frame to its page, and back to its place', async ({ page }) => {
    const work = works[2]!;
    await open(page, '');
    await page.locator(`#title-${work.slug} a`).click();
    await page.waitForURL(`**/work/${work.slug}/`);
    await expect.poll(() => glide(page)).toBe(expected(work.slug));
    await settle(page);
    await page.locator('.work__back').click();
    await page.waitForURL(`**/#reel-${work.slug}`);
    await expect.poll(() => glide(page)).toBe(expected(work.slug));
  });

  test('pairs the frame of the last piece too, when coming back to it', async ({ page }) => {
    const work = works.at(-1)!;
    await open(page, `ar/work/${work.slug}/`);
    await page.locator('.work__back').click();
    await page.waitForURL(`**/#reel-${work.slug}`);
    await expect.poll(() => glide(page)).toBe(expected(work.slug));
  });

  test('moves a "More work" thumbnail into its page', async ({ page }) => {
    const [from, to] = [works[0]!, works[1]!];
    await open(page, `ar/work/${from.slug}/`);
    await page.locator(`.more a[href$="/work/${to.slug}/"]`).click();
    await page.waitForURL(`**/work/${to.slug}/`);
    await expect.poll(() => glide(page)).toBe(expected(to.slug));
  });

  test('sends no frame off screen when going home by the name in the header', async ({ page }) => {
    const work = works.at(-1)!;
    await open(page, `ar/work/${work.slug}/`);
    await page.locator('.site-header .brand').click();
    await page.waitForURL((url) => !url.pathname.includes('/work/'));
    await expect.poll(() => glide(page)).not.toBeNull();
    // Either no transition ran, or it named nothing on the new page.
    const record = (await glide(page))!;
    expect(record === 'none' || JSON.parse(record).named.length === 0, record).toBe(true);
  });

  test('names no frame outside a page change, even after going back', async ({ page }) => {
    const work = works[0]!;
    await page.goto('ar/');
    await expect(page.locator('.is-gliding')).toHaveCount(0);
    await page.locator(`#title-${work.slug} a`).click();
    await page.waitForURL(`**/work/${work.slug}/`);
    await expect(page.locator('.is-gliding')).toHaveCount(0);
    await page.goBack();
    await page.waitForURL((url) => !url.pathname.includes('/work/'));
    await expect(page.locator('.is-gliding')).toHaveCount(0);
  });

  test.describe('with reduced motion', () => {
    test.use({ reducedMotion: 'reduce' });

    test('changes pages without a glide', async ({ page }) => {
      await open(page, '');
      await page.locator(`#title-${works[0]!.slug} a`).click();
      await page.waitForURL(`**/work/${works[0]!.slug}/`);
      await expect.poll(() => glide(page)).toBe('none');
    });
  });

  test.describe('where the browser has no Navigation API (Safari 18)', () => {
    test.skip(({ browserName }) => browserName !== 'chromium', 'Chromium stands in for Safari 18, with the API taken away.');
    test.beforeEach(async ({ page }) => {
      await page.addInitScript(() => {
        Object.defineProperty(window, 'navigation', { value: undefined });
        Object.defineProperty(PageSwapEvent.prototype, 'activation', { get: () => null });
      });
    });
    /** Waits for the glide into this page to end: a page change during it starts without a frame named. */
    const glided = (page: Page) => expect(page.locator('.is-gliding')).toHaveCount(0);
    /** Comes back to the feed at `first` by "All work", and finds another piece on screen beside it. */
    const besideIn = async (page: Page, first: string) => {
      await open(page, `ar/work/${first}/`);
      await page.locator('.work__back').click();
      await page.waitForURL(`**/#reel-${first}`);
      await glided(page);
      const other = await page.evaluate(
        (slug) =>
          [...document.querySelectorAll<HTMLElement>('#work [data-frame]')].find((el) => {
            const { top, bottom } = el.getBoundingClientRect();
            return el.dataset.frame !== slug && bottom > 0 && top < innerHeight;
          })?.dataset.frame,
        first,
      );
      expect(other, 'another piece on screen').toBeTruthy();
      await settle(page);
      return other!;
    };

    test('pairs the piece just left with its own frame when going back', async ({ page }) => {
      const other = await besideIn(page, works[0]!.slug);
      await page.locator(`#title-${other} a`).click();
      await page.waitForURL(`**/work/${other}/`);
      await expect.poll(() => glide(page)).toBe(expected(other));
      await glided(page);
      await settle(page);
      await page.goBack();
      await page.waitForURL(`**/#reel-${works[0]!.slug}`);
      await expect.poll(() => glide(page)).toBe(expected(other));
    });

    test('moves no frame for a title opened in a new tab when the page later changes', async ({ page, context }) => {
      const first = works[0]!.slug;
      const other = await besideIn(page, first);
      const tab = context.waitForEvent('page');
      await page.locator(`#title-${other} a`).click({ modifiers: ['ControlOrMeta'] });
      await (await tab).close();
      await page.goBack();
      await page.waitForURL(`**/work/${first}/`);
      await expect.poll(() => glide(page)).not.toBeNull();
      expect(JSON.parse((await glide(page))!)).toMatchObject({ named: [], frames: '[]' });
    });
  });
});
