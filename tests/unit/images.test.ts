import { randomBytes } from 'node:crypto';
import { mkdtempSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { renderOg } from '../../scripts/media/images.ts';

let dir: string;
let noise: string;

beforeAll(async () => {
  dir = mkdtempSync(join(tmpdir(), 'portfolio-images-'));
  noise = join(dir, 'noise.png');
  // Pure noise is the worst case for JPEG size: the quality loop has to work to stay under the limit.
  await sharp(randomBytes(1080 * 1080 * 3), { raw: { width: 1080, height: 1080, channels: 3 } }).png().toFile(noise);
});

afterAll(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe('renderOg', () => {
  it('writes exactly the JPEG it measured, so the size limit holds for the file WhatsApp fetches', async () => {
    const out = join(dir, 'og.jpg');
    const bytes = await renderOg(noise, { width: 1080, height: 1080 }, 'site/brand/og-wordmark.png', out);
    expect(statSync(out).size).toBe(bytes);
    expect(bytes).toBeLessThan(300_000);
    const meta = await sharp(out).metadata();
    expect([meta.width, meta.height, meta.format]).toEqual([1200, 630, 'jpeg']);
  });
});
