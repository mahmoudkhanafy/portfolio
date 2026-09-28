import { describe, expect, it } from 'vitest';
import { orientationOf, pick, ratioOf } from '../../src/lib/localize.ts';

describe('pick', () => {
  it('uses the English text on English pages', () => {
    expect(pick({ ar: 'جري', en: 'Run' }, 'en')).toEqual({ text: 'Run', lang: 'en', dir: 'ltr' });
  });
  it('falls back to Arabic, marked as Arabic, when English is missing', () => {
    expect(pick({ ar: 'جري', en: null }, 'en')).toEqual({ text: 'جري', lang: 'ar', dir: 'rtl' });
  });
  it('uses Arabic on Arabic pages', () => {
    expect(pick({ ar: 'جري', en: 'Run' }, 'ar')).toEqual({ text: 'جري', lang: 'ar', dir: 'rtl' });
  });
  it('returns nothing when both are empty', () => {
    expect(pick({ ar: null, en: null }, 'ar')).toBeNull();
  });
});

describe('orientationOf', () => {
  it.each([
    [1920, 1080, 'landscape'],
    [1080, 1080, 'square'],
    [1080, 1350, 'portrait'],
    [1080, 1920, 'portrait'],
  ] as const)('%sx%s is %s', (w, h, want) => {
    expect(orientationOf(w, h)).toBe(want);
  });
});

describe('ratioOf', () => {
  it.each([
    [1080, 1920, 0.5625],
    [1080, 1350, 0.8],
    [1920, 1080, 1.77778],
    [860, 360, 2.38889],
  ])('%sx%s is %s wide per unit of height', (w, h, want) => {
    expect(ratioOf(w, h)).toBe(want);
  });
});
