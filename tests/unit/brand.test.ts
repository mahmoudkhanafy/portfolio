import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { icoEntries } from '../../scripts/brand/ico.ts';

type Pixel = [number, number, number, number];

async function load(file: string | Buffer) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const at = (x: number, y: number): Pixel => {
    const i = (Math.round(y) * info.width + Math.round(x)) * 4;
    return [data[i]!, data[i + 1]!, data[i + 2]!, data[i + 3]!];
  };
  return { at, width: info.width, height: info.height };
}

const near = (a: Pixel, b: Pixel, tolerance = 3): boolean => a.every((v, i) => Math.abs(v - b[i]!) <= tolerance);
const GOLD: Pixel = [0xe8, 0xb1, 0x00, 255];

describe('icons (rendered by npm run brand)', () => {
  it.each(['public/icon-512.png', 'public/icon-192.png', 'public/favicon-96.png', 'public/favicon-48.png'])(
    '%s is a gold tile with see-through corners, so it sits on light and dark tab bars alike',
    async (file) => {
      const icon = await load(file);
      expect(icon.at(0, 0)[3]).toBe(0);
      expect(icon.at(icon.width - 1, icon.height - 1)[3]).toBe(0);
      expect(near(icon.at(icon.width / 2, icon.height * 0.06), GOLD)).toBe(true);
    },
  );

  it('the iPhone home-screen icon is gold to the corners (iOS rounds it, and turns transparency black)', async () => {
    const icon = await load('public/apple-touch-icon.png');
    for (const [x, y] of [[0, 0], [icon.width - 1, 0], [0, icon.height - 1], [icon.width - 1, icon.height - 1]] as const) {
      expect(near(icon.at(x, y), GOLD), `${x},${y}`).toBe(true);
    }
  });

  it('the maskable icon keeps everything but flat gold inside the circle Android always shows', async () => {
    const icon = await load('public/icon-maskable-512.png');
    const safe = icon.width * 0.4;
    const outside: string[] = [];
    for (let y = 0; y < icon.height; y += 4) {
      for (let x = 0; x < icon.width; x += 4) {
        if (Math.hypot(x - icon.width / 2, y - icon.height / 2) > safe && !near(icon.at(x, y), GOLD)) outside.push(`${x},${y}`);
      }
    }
    expect(outside.slice(0, 5)).toEqual([]);
  });
});

describe('link previews (rendered by npm run brand)', () => {
  it('the English pages have their own home card and wordmark, next to the Arabic ones', async () => {
    for (const [ar, en] of [['public/og-home.jpg', 'public/og-home-en.jpg'], ['site/brand/og-wordmark.png', 'site/brand/og-wordmark-en.png']] as const) {
      const [a, b] = await Promise.all([sharp(ar).metadata(), sharp(en).metadata()]);
      expect(b.format).toBe(a.format);
      if (ar.endsWith('.jpg')) expect([b.width, b.height]).toEqual([1200, 630]);
      expect((await sharp(en).raw().toBuffer()).equals(await sharp(ar).raw().toBuffer())).toBe(false);
    }
  });
});

describe('favicon.ico (rendered by npm run brand)', () => {
  it('holds the gold tile at 16, 32 and 48 px, for browsers and Google Search that ask for /favicon.ico', async () => {
    const entries = icoEntries(readFileSync('public/favicon.ico'));
    expect(entries.map((e) => e.size)).toEqual([16, 32, 48]);
    for (const entry of entries) {
      const icon = await load(entry.png);
      expect([icon.width, icon.height]).toEqual([entry.size, entry.size]);
      expect(near(icon.at(entry.size / 2, entry.size * 0.1), GOLD, 12)).toBe(true);
    }
  });
});
