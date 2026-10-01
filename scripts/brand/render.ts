/**
 * Renders brand artwork from the HTML templates in site/brand/templates with the real fonts.
 * Run once after changing a template (`npm run brand`); the outputs are committed.
 */
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from '@playwright/test';
import sharp from 'sharp';
import { writeOgJpeg } from '../media/images.ts';

const root = process.cwd();
const template = (name: string, hash = ''): string => pathToFileURL(resolve(root, 'site/brand/templates', name)).href + hash;
const only = new Set(process.argv.slice(2));
const wants = (name: string): boolean => only.size === 0 || only.has(name);

const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });
try {
  const page = await browser.newPage();
  const ready = () => page.evaluate(() => document.fonts.ready.then(() => document.fonts.size));

  if (wants('og-home')) {
    // The home page's link preview, one per language, written like every other preview (writeOgJpeg).
    await page.setViewportSize({ width: 1200, height: 630 });
    for (const lang of ['en', 'ar'] as const) {
      await page.goto(template('og-home.html', `?${lang}`));
      await ready();
      await page.evaluate(() => Promise.all([...document.images].map((img) => img.decode())));
      const bytes = await writeOgJpeg(await page.screenshot(), resolve(root, `public/og-home-${lang}.jpg`));
      console.log(`public/og-home-${lang}.jpg (${Math.round(bytes / 1000)} KB)`);
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
    for (const [file, master, size] of [['icon-192.png', standard, 192], ['favicon-32.png', standard, 32], ['apple-touch-icon.png', square, 180]] as const) {
      await sharp(master).resize(size, size, { kernel: 'lanczos3' }).png({ compressionLevel: 9 }).toFile(resolve(root, 'public', file));
      console.log(`public/${file}`);
    }
  }
} finally {
  await browser.close();
}
