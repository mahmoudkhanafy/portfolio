import type { Lang } from './urls.ts';

export interface LocalText {
  text: string;
  lang: Lang;
  dir: 'rtl' | 'ltr';
}

/** The text for a page language; English falls back to the Arabic original, marked as Arabic. */
export function pick(pair: { ar: string | null; en: string | null }, lang: Lang): LocalText | null {
  if (lang === 'en' && pair.en) return { text: pair.en, lang: 'en', dir: 'ltr' };
  if (pair.ar) return { text: pair.ar, lang: 'ar', dir: 'rtl' };
  return pair.en ? { text: pair.en, lang: 'en', dir: 'ltr' } : null;
}

export type Orientation = 'landscape' | 'portrait' | 'square';

/** Width per unit of height, for CSS: a frame's `aspect-ratio`, and its width from the height it may take. */
export const ratioOf = (width: number, height: number): number => Math.round((width / height) * 1e5) / 1e5;

/** Landscape at 1.3:1 and wider; portrait from 4:5-ish up; everything else reads as square. */
export function orientationOf(width: number, height: number): Orientation {
  if (width >= height * 1.3) return 'landscape';
  if (height >= width * 1.15) return 'portrait';
  return 'square';
}
