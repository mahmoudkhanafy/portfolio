import { expect, test } from '@playwright/test';
import { videoState, works } from './helpers.ts';

/** A piece with both an hd and an sd file, so switching between them can be tested. */
const piece = works.find((w) => w.renditions.length > 1)!;
const workPath = `work/${piece.slug}/`;

test.describe('player', () => {
  test('plays with sound after one tap', async ({ page }) => {
    await page.goto(workPath);
    await page.locator('.player__play').click();
    await expect.poll(async () => (await videoState(page)).time, { timeout: 15_000 }).toBeGreaterThan(0.5);
    const state = await videoState(page);
    expect(state).toMatchObject({ paused: false, muted: false, controls: true });
    await expect(page.locator('[data-player]')).toHaveClass(/is-live/);
  });

  test('starts from the keyboard', async ({ page }) => {
    await page.goto(workPath);
    const play = page.getByRole('button', { name: new RegExp(piece.title.ar) });
    await play.focus();
    await page.keyboard.press('Enter');
    await expect.poll(async () => (await videoState(page)).time, { timeout: 15_000 }).toBeGreaterThan(0.3);
    expect(await page.evaluate(() => document.activeElement?.tagName)).toBe('VIDEO');
  });

  test.describe('on a sharp screen', () => {
    test.use({ deviceScaleFactor: 3 });

    test('switches to the lighter file when the sharp one fails', async ({ page }) => {
      await page.route('**/hd.*.mp4', (route) => route.abort('failed'));
      await page.goto(workPath);
      await page.locator('.player__play').click();
      await expect.poll(async () => (await videoState(page)).src, { timeout: 15_000 }).toContain('/sd.');
      await expect.poll(async () => (await videoState(page)).time, { timeout: 15_000 }).toBeGreaterThan(0.3);
      await expect(page.locator('.player__error')).toBeHidden();
    });
  });

  test('explains the problem when no file can play', async ({ page }) => {
    await page.route('**/*.mp4', (route) => route.abort('failed'));
    await page.goto(workPath);
    await page.locator('.player__play').click();
    await expect(page.locator('.player__error')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('.player__error a')).toHaveAttribute('href', /\.mp4$/);
  });

  test('ends on an invitation to message Mahmoud', async ({ page }) => {
    await page.goto(workPath);
    await page.locator('.player__play').click();
    await expect.poll(async () => (await videoState(page)).time, { timeout: 15_000 }).toBeGreaterThan(0.2);
    await page.locator('[data-player] video').evaluate((video: HTMLVideoElement) => (video.currentTime = video.duration - 0.4));
    const end = page.locator('.player__end');
    await expect(end).toBeVisible({ timeout: 10_000 });
    await expect(end.locator('a')).toHaveAttribute('href', /^https:\/\/wa\.me\/201156379179\?text=/);
    await end.getByRole('button').click();
    await expect(end).toBeHidden();
    await expect.poll(async () => (await videoState(page)).time).toBeLessThan(3);
  });

  test('plays one video at a time', async ({ page }) => {
    await page.goto('');
    const players = page.locator('[data-reel] [data-player]');
    await players.nth(0).locator('.player__play').click();
    await expect.poll(async () => (await videoState(page, '[data-reel] [data-player] >> nth=0')).time, { timeout: 15_000 }).toBeGreaterThan(0.3);
    await players.nth(1).locator('.player__play').click();
    await expect.poll(async () => (await videoState(page, '[data-reel] [data-player] >> nth=1')).time, { timeout: 15_000 }).toBeGreaterThan(0.3);
    expect((await videoState(page, '[data-reel] [data-player] >> nth=0')).paused).toBe(true);
  });
});

test.describe('muted previews in the feed', () => {
  test('start after the visitor scrolls, on the lighter file, and "tap for sound" restarts with sound on the sharp one', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Phones preview the piece in view; mice preview on hover.');
    const first = page.locator('[data-reel]').first();
    const state = () => videoState(page, '[data-reel] [data-player] >> nth=0');
    await page.goto('');
    await first.scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, 4));
    await expect.poll(async () => (await state()).time, { timeout: 15_000 }).toBeGreaterThan(0.3);
    expect(await state()).toMatchObject({ muted: true, paused: false, controls: false });
    expect((await state()).src).toContain('/sd.');
    await first.locator('.player__sound').click();
    // An iPhone frame is sharp enough to want hd; the preview's sd file is not reused for watching.
    await expect.poll(async () => (await state()).src).toContain('/hd.');
    await expect.poll(async () => (await state()).time, { timeout: 15_000 }).toBeGreaterThan(0.2);
    const watching = await state();
    expect(watching).toMatchObject({ muted: false, paused: false });
    expect(watching.time).toBeLessThan(3);
  });

  test('preview on hover with a mouse', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Hover previews are for mouse users.');
    await page.goto('');
    const first = page.locator('[data-reel] [data-player]').first();
    await first.hover();
    await expect.poll(async () => (await videoState(page, '[data-reel] [data-player] >> nth=0')).time, { timeout: 15_000 }).toBeGreaterThan(0.2);
    expect(await videoState(page, '[data-reel] [data-player] >> nth=0')).toMatchObject({ muted: true, src: expect.stringContaining('/sd.') });
    await page.mouse.move(0, 0);
    await expect.poll(async () => (await videoState(page, '[data-reel] [data-player] >> nth=0')).paused).toBe(true);
  });

  test.describe('with reduced motion', () => {
    test.use({ reducedMotion: 'reduce' });

    test('never preview and do not animate the lower third', async ({ page }) => {
      await page.goto('');
      expect(await page.locator('.hero__name').evaluate((el) => getComputedStyle(el).animationName)).toBe('none');
      const first = page.locator('[data-reel]').first();
      await first.scrollIntoViewIfNeeded();
      await page.evaluate(() => window.scrollBy(0, 4));
      await first.hover();
      await page.waitForTimeout(1500);
      expect((await videoState(page, '[data-reel] [data-player] >> nth=0')).exists).toBe(false);
    });
  });
});
