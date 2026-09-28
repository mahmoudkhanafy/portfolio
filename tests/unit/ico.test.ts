import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { ico, icoEntries } from '../../scripts/brand/ico.ts';

const png = (size: number) => sharp({ create: { width: size, height: size, channels: 4, background: '#e8b100' } }).png().toBuffer();

describe('ico', () => {
  it('packs PNGs into an icon file that reads back the same', async () => {
    const pngs = await Promise.all([16, 32, 256].map(png));
    const file = ico(pngs.map((data, i) => ({ size: [16, 32, 256][i]!, data })));
    // Reserved 0, type 1 (icon), 3 images; a 256 px image is written as 0 in its one-byte size.
    expect([...file.subarray(0, 6)]).toEqual([0, 0, 1, 0, 3, 0]);
    expect(file[6 + 2 * 16]).toBe(0);
    expect(icoEntries(file)).toEqual([16, 32, 256].map((size, i) => ({ size, png: pngs[i] })));
  });
});
