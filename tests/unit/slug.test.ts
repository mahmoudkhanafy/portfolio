import { describe, expect, it } from 'vitest';
import { slugify, titleFromFileName } from '../../scripts/media/slug.ts';

describe('slugify', () => {
  it.each([
    ['muscle-up-basics', 'muscle-up-basics'],
    ['Muscle Up FINAL (2)', 'muscle-up-final-2'],
    ['Café Día', 'cafe-dia'],
    ['a&b', 'a-and-b'],
    ['--a--b--', 'a-b'],
    ['NIMUN_Recap.2025', 'nimun-recap-2025'],
  ])('%j → %j', (name, want) => {
    expect(slugify(name)).toBe(want);
  });

  it('caps long names at 60 characters without a trailing dash', () => {
    const slug = slugify('word '.repeat(30));
    expect(slug.length).toBeLessThanOrEqual(60);
    expect(slug.endsWith('-')).toBe(false);
    expect(slug.startsWith('word-word')).toBe(true);
  });

  it('gives Arabic-only names a stable ASCII fallback', () => {
    const first = slugify('فيديو جديد');
    expect(first).toMatch(/^video-[0-9a-f]{6}$/);
    expect(slugify('فيديو جديد')).toBe(first);
    expect(slugify('فيديو قديم')).not.toBe(first);
  });

  it('keeps the Latin part of mixed names', () => {
    expect(slugify('ريل Muscle Up')).toBe('muscle-up');
  });
});

describe('titleFromFileName', () => {
  it.each([
    ['nimun_recap-2025', 'Nimun recap 2025'],
    ['فيديو-جديد', 'فيديو جديد'],
    ['my  clip', 'My clip'],
  ])('%j → %j', (stem, want) => {
    expect(titleFromFileName(stem)).toBe(want);
  });
});
