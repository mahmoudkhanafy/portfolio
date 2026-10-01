import { writeFile } from 'node:fs/promises';
import sharp from 'sharp';
import type { Size } from './ladder.ts';

/** A rendered file inside a cache directory. */
export interface FileRef {
  file: string;
  width: number;
}

export interface CoverSet {
  width: number;
  height: number;
  color: string;
  lqip: string;
  avif: FileRef[];
  webp: FileRef[];
  jpg: FileRef;
}

export interface PortraitSet {
  width: number;
  height: number;
  avif: FileRef[];
  webp: FileRef[];
  png: FileRef;
}

/** WhatsApp drops a link-preview image over 300 KB; this leaves room. */
export const OG_MAX_BYTES = 280_000;

/** Cover widths for srcset: phone and grid sizes, plus wide sizes for landscape work. Never upscaled. */
export function coverWidths(size: Size): number[] {
  const wanted = size.width > size.height * 1.2 ? [480, 720, 1080, 1440, 1920] : [480, 720, 1080];
  const fitting = wanted.filter((w) => w <= size.width);
  return fitting.length > 0 ? fitting : [size.width];
}

const hex = (n: number): string => n.toString(16).padStart(2, '0');

/** AVIF/WebP at several widths, a JPEG fallback, a tiny blurred placeholder and the dominant colour. */
export async function renderCover(framePng: string, dir: string): Promise<CoverSet> {
  const meta = await sharp(framePng).metadata();
  const size = { width: meta.width ?? 0, height: meta.height ?? 0 };
  const widths = coverWidths(size);
  const avif: FileRef[] = [];
  const webp: FileRef[] = [];
  for (const width of widths) {
    await sharp(framePng).resize({ width }).avif({ quality: 52, effort: 4 }).toFile(`${dir}/cover-${width}.avif`);
    avif.push({ file: `cover-${width}.avif`, width });
    await sharp(framePng).resize({ width }).webp({ quality: 74 }).toFile(`${dir}/cover-${width}.webp`);
    webp.push({ file: `cover-${width}.webp`, width });
  }
  const jpgWidth = Math.min(720, size.width);
  await sharp(framePng).resize({ width: jpgWidth }).jpeg({ quality: 78, mozjpeg: true }).toFile(`${dir}/cover-${jpgWidth}.jpg`);
  const tiny = await sharp(framePng).resize({ width: 16 }).webp({ quality: 40 }).toBuffer();
  const { dominant } = await sharp(framePng).stats();
  return {
    ...size,
    color: `#${hex(dominant.r)}${hex(dominant.g)}${hex(dominant.b)}`,
    lqip: `data:image/webp;base64,${tiny.toString('base64')}`,
    avif,
    webp,
    jpg: { file: `cover-${jpgWidth}.jpg`, width: jpgWidth },
  };
}

/** The frame as a high-quality still, from which the link-preview cards are drawn (scripts/media/og.ts). */
export async function renderStill(framePng: string, out: string): Promise<void> {
  await sharp(framePng).jpeg({ quality: 92, mozjpeg: true, chromaSubsampling: '4:4:4' }).toFile(out);
}

/**
 * Writes a link-preview image as JPEG at the best quality that keeps it under the size WhatsApp still
 * shows large: without colour subsampling first, so its text and the orange stay sharp, and only for
 * a picture too busy for that, with it.
 */
export async function writeOgJpeg(png: Buffer, out: string): Promise<number> {
  const steps: Array<[number, '4:4:4' | '4:2:0']> = [
    [90, '4:4:4'], [84, '4:4:4'], [78, '4:4:4'], [72, '4:4:4'],
    [72, '4:2:0'], [62, '4:2:0'], [52, '4:2:0'], [42, '4:2:0'], [32, '4:2:0'],
  ];
  let jpeg = Buffer.alloc(0);
  for (const [quality, chromaSubsampling] of steps) {
    jpeg = await sharp(png).jpeg({ quality, mozjpeg: true, chromaSubsampling }).toBuffer();
    if (jpeg.length <= OG_MAX_BYTES) break;
  }
  // Written as measured: letting sharp write it would re-encode it, at another size.
  await writeFile(out, jpeg);
  return jpeg.length;
}

/** The cut-out portrait at a few widths, keeping its transparency. */
export async function renderPortrait(srcPng: string, dir: string): Promise<PortraitSet> {
  const trimmed = await sharp(srcPng).trim().png().toBuffer();
  const meta = await sharp(trimmed).metadata();
  const size = { width: meta.width ?? 0, height: meta.height ?? 0 };
  const widths = [360, 540, 720, 960].filter((w) => w <= size.width);
  if (widths.length === 0) widths.push(size.width);
  const avif: FileRef[] = [];
  const webp: FileRef[] = [];
  for (const width of widths) {
    await sharp(trimmed).resize({ width }).avif({ quality: 56, effort: 4 }).toFile(`${dir}/portrait-${width}.avif`);
    avif.push({ file: `portrait-${width}.avif`, width });
    await sharp(trimmed).resize({ width }).webp({ quality: 80, alphaQuality: 90 }).toFile(`${dir}/portrait-${width}.webp`);
    webp.push({ file: `portrait-${width}.webp`, width });
  }
  const pngWidth = widths[Math.min(1, widths.length - 1)]!;
  await sharp(trimmed).resize({ width: pngWidth }).png({ palette: true, quality: 85, compressionLevel: 9 }).toFile(`${dir}/portrait-${pngWidth}.png`);
  return { ...size, avif, webp, png: { file: `portrait-${pngWidth}.png`, width: pngWidth } };
}
