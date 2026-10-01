import { expect, test, type Locator, type Page } from '@playwright/test';
import { isFramed, PHONE_SHAPE, SCREEN_SHAPE, SCREEN_SHARE } from '../../src/lib/phone.ts';
import { works } from './helpers.ts';

type Box = { x: number; y: number; width: number; height: number };

/** The narrowest a frame's screen gets: room for the play button, in English. */
const MIN_FRAME_WIDTH = 14 * 16;
/** The narrowest phone: its screen keeps that room. */
const MIN_PHONE_WIDTH = MIN_FRAME_WIDTH / SCREEN_SHARE;

const shape = (w: { width: number; height: number }) => w.width / w.height;
const pieceIn = (page: Page, slug: string) => page.locator('[data-reel]').filter({ has: page.locator(`#title-${slug}`) });
const frameIn = (page: Page, slug: string) => pieceIn(page, slug).locator('[data-player]');
const box = async (locator: Locator): Promise<Box> => (await locator.boundingBox())!;
/**
 * The phone a reel stands in, where one is drawn (wider screens), or null. Below 760 px the phone is
 * `display: contents`: Chromium gives it no box, but WebKit reports its child's, so ask its display.
 */
const phoneOf = async (scope: Locator): Promise<Box | null> => {
  const phone = scope.locator('.phone--on');
  if ((await phone.count()) === 0) return null;
  return (await phone.evaluate((el) => getComputedStyle(el).display === 'contents')) ? null : box(phone);
};
/** What stands in the layout: the phone, or the frame itself. */
const outline = async (scope: Locator): Promise<Box> => (await phoneOf(scope)) ?? box(scope.locator('[data-player]'));
const inside = (inner: Box, outer: Box) =>
  inner.x >= outer.x - 0.5 && inner.y >= outer.y - 0.5 && inner.x + inner.width <= outer.x + outer.width + 0.5 && inner.y + inner.height <= outer.y + outer.height + 0.5;
const overlap = (a: Box, b: Box) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

/** The real pixel shape of a cover image and of the lightest video file, as a browser decodes them. */
const mediaShapes = (frame: Locator) =>
  frame.evaluate(async (root) => {
    const img = root.querySelector<HTMLImageElement>('.player__cover img')!;
    const still = new Image();
    still.src = img.src;
    await still.decode();
    const renditions = JSON.parse(root.dataset.renditions!) as Array<{ src: string }>;
    const video = document.createElement('video');
    video.muted = true;
    video.preload = 'metadata';
    video.src = renditions.at(-1)!.src;
    await new Promise((resolve, reject) => {
      video.onloadedmetadata = resolve;
      video.onerror = reject;
    });
    return { cover: still.naturalWidth / still.naturalHeight, video: video.videoWidth / video.videoHeight };
  });

test.describe('video frames', () => {
  test('show every video at its true shape, a vertical one filling a 9:19.5 phone screen on wider screens', async ({ page }) => {
    const squeezed = works.find((w) => w.slug === 'squeezed-reel');
    expect(squeezed, 'the e2e build adds tests/fixtures/work/ (npm run build:e2e)').toBeDefined();
    expect(shape(squeezed!)).toBeCloseTo(9 / 16, 3);

    await page.goto('ar/');
    const wide = page.viewportSize()!.width >= 760;
    for (const work of works) {
      const piece = pieceIn(page, work.slug);
      const framed = wide && isFramed(shape(work));
      const screen = await box(piece.locator('[data-player]'));
      expect(screen.width / screen.height, `${work.slug} frame`).toBeCloseTo(framed ? SCREEN_SHAPE : shape(work), 2);
      const picture = await box(piece.locator('.player__media'));
      expect(picture.width / picture.height, `${work.slug} picture`).toBeCloseTo(shape(work), 2);
      if (framed) expect(picture.height, `${work.slug} fills its screen`).toBeGreaterThanOrEqual(screen.height - 1);
      const media = await mediaShapes(piece.locator('[data-player]'));
      expect(media.cover, `${work.slug} cover`).toBeCloseTo(shape(work), 2);
      expect(media.video, `${work.slug} video`).toBeCloseTo(shape(work), 2);
    }
  });

  test('stand vertical reels in the phone on wider screens, and never on phones', async ({ page, isMobile }) => {
    await page.goto('ar/');
    for (const work of works) {
      const phone = await phoneOf(pieceIn(page, work.slug));
      expect(phone !== null, work.slug).toBe(!isMobile && isFramed(shape(work)));
      if (phone) expect(phone.width / phone.height, `${work.slug} phone`).toBeCloseTo(PHONE_SHAPE, 2);
    }
  });

  test('fit on the first screen of their page, play button included', async ({ page }) => {
    const viewport = page.viewportSize()!;
    for (const work of works) {
      await page.goto(`ar/work/${work.slug}/`);
      const frame = await outline(page.locator('.work__media'));
      expect(frame.y + frame.height, `${work.slug} frame bottom`).toBeLessThanOrEqual(viewport.height);
      expect(inside(await box(page.locator('.player__pill')), await box(page.locator('[data-player]'))), `${work.slug} play button`).toBe(true);
      const phone = await phoneOf(page.locator('.work__media'));
      expect(frame.width / frame.height, `${work.slug} shape`).toBeCloseTo(phone ? PHONE_SHAPE : shape(work), 2);
    }
  });

  for (const size of [null, { width: 844, height: 390 }, { width: 1366, height: 657 }] as const) {
    test(`fit on one screen in the feed and keep their buttons whole${size ? ` (${size.width}×${size.height})` : ''}`, async ({ page }) => {
      if (size) await page.setViewportSize(size);
      const viewport = page.viewportSize()!;
      for (const path of ['ar/', '']) {
        await page.goto(path);
        for (const work of works) {
          const piece = pieceIn(page, work.slug);
          const phone = await phoneOf(piece);
          const screen = await box(piece.locator('[data-player]'));
          const outer = phone ?? screen;
          const pill = await box(piece.locator('.player__pill'));
          const time = await box(piece.locator('.player__time'));
          if (outer.height > viewport.height) {
            // Only when the screen is too short for a frame its buttons fit in.
            expect(outer.width, `${path}${work.slug} is only as wide as its buttons need`).toBeLessThanOrEqual((phone ? MIN_PHONE_WIDTH : MIN_FRAME_WIDTH) + 1);
          }
          expect(inside(pill, screen), `${path}${work.slug} play button`).toBe(true);
          expect(inside(time, screen), `${path}${work.slug} duration`).toBe(true);
          expect(time.height, `${path}${work.slug} duration stays a small label`).toBeLessThan(40);
          expect(overlap(pill, time), `${path}${work.slug} play button clear of the duration`).toBe(false);
          if (phone) {
            const island = await box(piece.locator('.phone__island'));
            expect(overlap(island, pill), `${path}${work.slug} play button clear of the island`).toBe(false);
            expect(overlap(island, time), `${path}${work.slug} duration clear of the island`).toBe(false);
          }
        }
      }
    });
  }

  test('run edge to edge on phones, and sit centred when a tall video must be narrower, square like the page', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'The edge-to-edge feed is the phone layout.');
    const viewport = page.viewportSize()!;
    await page.goto('ar/');
    let narrower = 0;
    for (const work of works) {
      const frame = frameIn(page, work.slug);
      const { x, width } = await box(frame);
      const radius = await frame.evaluate((el) => parseFloat(getComputedStyle(el).borderTopLeftRadius));
      if (width >= viewport.width - 1) {
        expect([Math.round(x), radius], `${work.slug} edge to edge`).toEqual([0, 0]);
      } else {
        narrower += 1;
        expect(Math.abs(x - (viewport.width - x - width)), `${work.slug} centred`).toBeLessThanOrEqual(1);
        expect(radius, `${work.slug} square`).toBe(0);
      }
    }
    expect(narrower, 'the 9:16 pieces are too tall to run edge to edge on this phone').toBeGreaterThan(0);
  });

  test('give every frame in a row of the grid one height, so frames and titles line up', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Phones show one piece per row.');
    await page.goto('ar/');
    const rows = new Map<number, Array<{ slug: string; top: number; height: number; title: number }>>();
    for (const work of works) {
      const article = await box(page.locator('[data-reel]').filter({ has: page.locator(`#title-${work.slug}`) }));
      const frame = await outline(pieceIn(page, work.slug));
      const title = await box(page.locator(`#title-${work.slug}`));
      const row = Math.round(article.y);
      rows.set(row, [...(rows.get(row) ?? []), { slug: work.slug, top: frame.y, height: frame.height, title: title.y }]);
    }
    const mixed = [...rows.values()].filter((row) => row.length > 1);
    expect(mixed.length, 'the grid has rows with more than one piece').toBeGreaterThan(0);
    for (const row of mixed) {
      const [first, ...rest] = row;
      for (const item of rest) {
        expect(Math.abs(item.top - first!.top), `${item.slug} starts level with ${first!.slug}`).toBeLessThanOrEqual(1);
        expect(Math.abs(item.height - first!.height), `${item.slug} is as tall as ${first!.slug}`).toBeLessThanOrEqual(1);
        expect(Math.abs(item.title - first!.title), `${item.slug} title lines up with ${first!.slug}`).toBeLessThanOrEqual(1);
      }
    }
  });

  const screens = [
    { width: 820, height: 1180 }, // a tablet: two reels a row
    { width: 1000, height: 700 }, // three, on a narrow screen
    { width: 1280, height: 720 },
    { width: 1440, height: 900 },
    { width: 1366, height: 657 }, // a 1366×768 laptop's browser: four
    { width: 1920, height: 960 }, // the feed stops widening: three
  ];
  for (const size of screens) {
    test(`fill every row but the last, best piece first, in Mahmoud's order within each row (${size.width}×${size.height})`, async ({ page, isMobile }) => {
      test.skip(isMobile, 'Phones show one piece per row, in order.');
      await page.setViewportSize(size);
      await page.goto('ar/');
      const list = await box(page.locator('.feed__list'));
      const rows = new Map<number, Array<{ rank: number; frame: Box; x: number; right: number; count: number; time: number; phone: boolean }>>();
      for (const [rank, work] of works.entries()) {
        const article = page.locator('[data-reel]').filter({ has: page.locator(`#title-${work.slug}`) });
        const reel = await box(article);
        const frame = await outline(article);
        const phone = (await phoneOf(article)) !== null;
        const time = (await box(frameIn(page, work.slug).locator('.player__time'))).y;
        // How many pieces the layout (lib/rows.ts) shares this row between; more than it holds means
        // the layout leaves the row unfinished on purpose.
        const count = await article.evaluate((el) => Number(getComputedStyle(el).getPropertyValue('--n')));
        const row = Math.round(reel.y);
        rows.set(row, [...(rows.get(row) ?? []), { rank, frame, x: reel.x, right: reel.x + reel.width, count, time, phone }]);
      }
      const lines = [...rows.entries()].sort(([a], [b]) => a - b).map(([, line]) => line);
      expect(lines.length).toBeGreaterThan(1);
      // Right to left: the Arabic page reads from the right.
      const reading = lines.map((line) => [...line].sort((a, b) => b.right - a.right).map((item) => item.rank));
      expect(reading[0]![0], 'his first piece comes first').toBe(0);
      for (const ranks of reading) expect(ranks, 'a row keeps his order').toEqual([...ranks].sort((a, b) => a - b));
      for (const line of lines) {
        // A phone's duration sits inside its bezel, so durations line up with their own kind.
        for (const kind of [true, false]) {
          const times = line.filter((item) => item.phone === kind).map((item) => item.time);
          if (times.length > 1) expect(Math.max(...times) - Math.min(...times), 'the durations in a row line up').toBeLessThanOrEqual(1);
        }
      }
      const full = lines.filter((line) => line[0]!.count === line.length);
      expect(full.length, 'rows laid out full').toBeGreaterThan(1);
      for (const line of full) {
        const span = Math.max(...line.map((item) => item.right)) - Math.min(...line.map((item) => item.x));
        // A row too tall for the screen keeps its frames whole and leaves the rest of the row.
        const capped = line.every((item) => item.frame.height >= size.height - 32 - 2);
        expect(span >= list.width - 4 || capped, `a row spans ${Math.round(span)} of ${Math.round(list.width)} px`).toBe(true);
      }
    });
  }

  test('ease a phone’s picture from filling its screen to whole when it plays with sound', async ({ page, isMobile }) => {
    test.skip(isMobile, 'The phone frame is for wider screens.');
    const work = works.find((w) => Math.abs(shape(w) - 9 / 16) < 0.01)!;
    await page.goto(`ar/work/${work.slug}/`);
    const screen = await box(page.locator('[data-player]'));
    const picture = page.locator('[data-player] .player__media');
    const rest = await box(picture);
    expect(rest.width / rest.height).toBeCloseTo(9 / 16, 2);
    expect(rest.width, 'filled: a little of each side is cut').toBeGreaterThan(screen.width + 10);
    await page.locator('.player__play').click();
    await expect.poll(async () => {
      const now = await box(picture);
      return Math.abs(now.width - screen.width) <= 1 && inside(now, screen);
    }, { timeout: 5_000 }).toBe(true);
  });

  test('draw the phone in Safari, with round corners where corner-shape is missing', async ({ page, browserName }) => {
    test.skip(browserName !== 'webkit', 'A Safari check.');
    await page.setViewportSize({ width: 1024, height: 768 });
    const work = works.find((w) => isFramed(shape(w)))!;
    await page.goto(`ar/work/${work.slug}/`);
    const phone = await phoneOf(page.locator('.work__media'));
    expect(phone, 'a phone at 1024 px').not.toBeNull();
    expect(phone!.width / phone!.height).toBeCloseTo(PHONE_SHAPE, 2);
    const screen = await box(page.locator('[data-player]'));
    expect(screen.width / screen.height).toBeCloseTo(SCREEN_SHAPE, 2);
    const corners = await page.locator('.phone--on').evaluate((el) => ({
      radius: parseFloat(getComputedStyle(el).borderTopLeftRadius) / el.getBoundingClientRect().width,
      shaped: CSS.supports('corner-shape', 'superellipse(1.38)'),
    }));
    // Round corners at 18.2% where corner-shape is missing (Safari today), the superellipse's 22.8% where it is not.
    expect(corners.radius).toBeCloseTo(corners.shaped ? 0.228 : 0.182, 2);
  });

  test('give a phone on its page a column exactly as wide as the phone, never too narrow for its play button', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Phones show one column.');
    const work = works.find((w) => isFramed(shape(w)))!;
    for (const size of [{ width: 1440, height: 900 }, { width: 1366, height: 657 }]) {
      await page.setViewportSize(size);
      await page.goto(`ar/work/${work.slug}/`);
      const column = await box(page.locator('.work__media'));
      const phone = (await phoneOf(page.locator('.work__media')))!;
      expect(Math.abs(column.width - phone.width), `${size.width}×${size.height} column`).toBeLessThanOrEqual(1);
      expect(phone.width, `${size.width}×${size.height} phone`).toBeGreaterThanOrEqual(MIN_PHONE_WIDTH - 0.5);
    }
  });
});
