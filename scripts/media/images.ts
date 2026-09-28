import { writeFile } from 'node:fs/promises';
import sharp, { type OverlayOptions } from 'sharp';
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

const OG = { width: 1200, height: 630, pad: 40, radius: 18, maxBytes: 290_000 };

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

const BADGE = 76;
const playBadge = (): Buffer =>
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${BADGE}" height="${BADGE}" viewBox="0 0 120 120">
      <circle cx="60" cy="60" r="56" fill="rgba(0,0,0,0.66)" stroke="#ffffff" stroke-width="5"/>
      <path d="M49 38 L85 60 L49 82 Z" fill="#ffffff"/>
    </svg>`,
  );

const roundedMask = (width: number, height: number, radius: number): Buffer =>
  Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="${width}" height="${height}" rx="${radius}" ry="${radius}"/></svg>`);

/**
 * The link-preview image WhatsApp and Instagram show: 1200×630, the frame on a blurred fill of itself
 * (or full-bleed for wide video), a play badge that says "video", and the bilingual wordmark.
 */
export async function renderOg(framePng: string, size: Size, wordmarkPng: string, out: string): Promise<number> {
  const layers: OverlayOptions[] = [];
  let base: Buffer;
  // The play badge sits in the frame's lower corner, clear of the faces most covers are centred on.
  let badge = { left: OG.width - BADGE - 28, top: OG.height - BADGE - 28 };
  if (size.width / size.height >= 1.6) {
    base = await sharp(framePng).resize(OG.width, OG.height, { fit: 'cover' }).toBuffer();
  } else {
    base = await sharp(framePng).resize(OG.width, OG.height, { fit: 'cover' }).blur(28).modulate({ brightness: 0.42 }).toBuffer();
    const height = OG.height - OG.pad * 2;
    const width = Math.round((height * size.width) / size.height);
    const framed = await sharp(framePng)
      .resize(width, height, { fit: 'cover' })
      .composite([{ input: roundedMask(width, height, OG.radius), blend: 'dest-in' }])
      .png()
      .toBuffer();
    const left = Math.round((OG.width - width) / 2);
    layers.push({ input: framed, left, top: OG.pad });
    badge = { left: left + width - BADGE - 20, top: OG.pad + height - BADGE - 20 };
  }
  layers.push({ input: playBadge(), ...badge });
  const mark = await sharp(wordmarkPng).metadata();
  layers.push({ input: wordmarkPng, left: 24, top: OG.height - (mark.height ?? 0) - 24 });

  const composed = await sharp(base).composite(layers).toBuffer();
  let quality = 82;
  let jpeg = await sharp(composed).jpeg({ quality, mozjpeg: true }).toBuffer();
  while (jpeg.length > OG.maxBytes && quality > 50) {
    quality -= 8;
    jpeg = await sharp(composed).jpeg({ quality, mozjpeg: true }).toBuffer();
  }
  // Written as measured: letting sharp write it would re-encode it without mozjpeg, at another size.
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
