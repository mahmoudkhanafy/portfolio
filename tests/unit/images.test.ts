import { randomBytes } from 'node:crypto';
import { mkdtempSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { writeOgJpeg } from '../../scripts/media/images.ts';

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

describe('writeOgJpeg', () => {
  it('keeps a card without colour subsampling, so its text and the orange stay sharp', async () => {
    const out = join(dir, 'card.jpg');
    const card = await sharp({ create: { width: 1200, height: 630, channels: 3, background: '#f2eee6' } })
      .composite([{ input: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect x="800" width="400" height="630" fill="#bd4225"/><text x="60" y="300" font-size="96" fill="#24251f">Before you try</text></svg>') }])
      .png()
      .toBuffer();
    const bytes = await writeOgJpeg(card, out);
    expect(statSync(out).size).toBe(bytes);
    const meta = await sharp(out).metadata();
    expect([meta.width, meta.height, meta.format, meta.chromaSubsampling]).toEqual([1200, 630, 'jpeg', '4:4:4']);
  });

  it('still fits a picture as busy as pure noise under the size WhatsApp shows, writing exactly what it measured', async () => {
    const out = join(dir, 'noise.jpg');
    const bytes = await writeOgJpeg(await sharp(noise).resize(1200, 630).png().toBuffer(), out);
    expect(statSync(out).size).toBe(bytes);
    expect(bytes).toBeLessThan(300_000);
  });
});
