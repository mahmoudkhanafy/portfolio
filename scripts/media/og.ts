/**
 * Link previews: one card per piece and language, drawn from site/brand/templates/og-work.html in a
 * headless Chromium (the site's own fonts and right-to-left layout), then written as a sharp JPEG.
 */
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { Browser, Page } from '@playwright/test';
import type { Lang } from '../../src/lib/urls.ts';
import { writeOgJpeg } from './images.ts';

/** What a card shows: the page's language for its labels, the title in its own language. */
export interface Card {
  lang: Lang;
  title: string;
  titleLang: Lang;
  /** What it is, for whom and how long ("Reel", "For V7", "0:30"), in the page's language. */
  label: string[];
  name: string;
  role: string;
  /** Width per unit of height of the piece. */
  ratio: number;
  /** Colour behind the frame while it loads, and around a frame that does not fill its place. */
  tint: string;
}

export const OG_SIZE = { width: 1200, height: 630 } as const;

/** The design ships with the code, wherever the videos come from. */
const REPO = fileURLToPath(new URL('../../', import.meta.url));
const TEMPLATE = 'site/brand/templates/og-work.html';
const DESIGN = [TEMPLATE, 'site/brand/templates/fonts.css', 'site/fonts/noto-sans-arabic.woff2', 'site/fonts/noto-sans-latin.woff2', 'site/fonts/barlow-condensed-600.woff2'];

/** A hash of everything that draws a card, so changing the design re-renders every card once. */
export async function designHash(): Promise<string> {
  const hash = createHash('sha256');
  for (const file of DESIGN) hash.update(await readFile(join(REPO, file)));
  return hash.digest('hex').slice(0, 16);
}

export const cardKey = (imageKey: string, card: Card, design: string): string =>
  createHash('sha256').update(JSON.stringify({ imageKey, card, design })).digest('hex').slice(0, 10);

/** Chromium from Playwright, or the machine's Chrome (GitHub's runners have it). */
async function launch(): Promise<Browser> {
  const { chromium } = await import('@playwright/test');
  const channels = [process.env.PW_CHROMIUM_CHANNEL || undefined, undefined, 'chrome'];
  let last: unknown;
  for (const channel of [...new Set(channels)]) {
    try {
      return await chromium.launch({ channel, args: ['--allow-file-access-from-files'] });
    } catch (error) {
      last = error;
    }
  }
  throw last;
}

export interface CardRenderer {
  render(card: Card, still: string, out: string): Promise<number>;
  close(): Promise<void>;
}

export async function openCardRenderer(): Promise<CardRenderer> {
  const browser = await launch();
  const page: Page = await browser.newPage({ viewport: OG_SIZE, deviceScaleFactor: 1 });
  const template = pathToFileURL(join(REPO, TEMPLATE));
  return {
    async render(card, still, out) {
      const url = new URL(template);
      url.searchParams.set('card', JSON.stringify({ ...card, still: pathToFileURL(still).href }));
      await page.goto(url.href);
      await page.waitForFunction(() => document.documentElement.dataset.ready === 'yes', null, { timeout: 15_000 });
      return writeOgJpeg(await page.screenshot({ type: 'png' }), out);
    },
    close: () => browser.close(),
  };
}
