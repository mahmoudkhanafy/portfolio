/**
 * Renders brand artwork from the HTML templates in site/brand/templates with the real fonts.
 * Run once after changing a template (`npm run brand`); the outputs are committed.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from '@playwright/test';
import sharp from 'sharp';
import { ico } from './ico.ts';

const root = process.cwd();
const template = (name: string, hash = ''): string => pathToFileURL(resolve(root, 'site/brand/templates', name)).href + hash;
const only = new Set(process.argv.slice(2));
const wants = (name: string): boolean => only.size === 0 || only.has(name);

const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });
try {
  const page = await browser.newPage();
  const ready = () => page.evaluate(() => document.fonts.ready.then(() => document.fonts.size));

  // One of each per page language: the Arabic pages' and the English pages' (?en) link previews.
  const languages = [
    ['', ''],
    ['?en', '-en'],
  ] as const;

  if (wants('wordmark')) {
    for (const [query, suffix] of languages) {
      await page.goto(template('wordmark.html', query));
      await ready();
      await page.locator('#mark').screenshot({ path: resolve(root, `site/brand/og-wordmark${suffix}.png`), omitBackground: true });
      console.log(`site/brand/og-wordmark${suffix}.png`);
    }
  }

  if (wants('og-home')) {
    await page.setViewportSize({ width: 1200, height: 630 });
    for (const [query, suffix] of languages) {
      await page.goto(template('og-home.html', query));
      await ready();
      await page.evaluate(() => Promise.all([...document.images].map((img) => img.decode())));
      const png = await page.screenshot();
      await sharp(png).jpeg({ quality: 84, mozjpeg: true }).toFile(resolve(root, `public/og-home${suffix}.jpg`));
      console.log(`public/og-home${suffix}.jpg`);
    }
  }

  if (wants('icons')) {
    await mkdir(resolve(root, 'public'), { recursive: true });
    await page.setViewportSize({ width: 512, height: 512 });
    // 512 px masters: the standard icon has see-through corners; "maskable" (Android) and "square" (iOS)
    // are full bleed because those platforms cut their own shape.
    const icon = async (variant = ''): Promise<Buffer> => {
      await page.goto(template('icon.html', variant && `?${variant}`));
      await ready();
      return page.screenshot({ omitBackground: true });
    };
    const standard = await icon();
    const square = await icon('square');
    for (const [file, master] of [['icon-512.png', standard], ['icon-maskable-512.png', await icon('maskable')]] as const) {
      await sharp(master).png({ compressionLevel: 9 }).toFile(resolve(root, 'public', file));
      console.log(`public/${file}`);
    }
    // Smaller sizes are downscaled from the masters so the letters stay crisp.
    const scaled = (master: Buffer, size: number): Promise<Buffer> => sharp(master).resize(size, size, { kernel: 'lanczos3' }).png({ compressionLevel: 9 }).toBuffer();
    // Google Search shows a site's favicon from a size that is a multiple of 48 px.
    for (const [file, master, size] of [
      ['icon-192.png', standard, 192],
      ['favicon-96.png', standard, 96],
      ['favicon-48.png', standard, 48],
      ['apple-touch-icon.png', square, 180],
    ] as const) {
      await writeFile(resolve(root, 'public', file), await scaled(master, size));
      console.log(`public/${file}`);
    }
    const sizes = [16, 32, 48];
    await writeFile(resolve(root, 'public/favicon.ico'), ico(await Promise.all(sizes.map(async (size) => ({ size, data: await scaled(standard, size) })))));
    console.log('public/favicon.ico');
  }
} finally {
  await browser.close();
}
