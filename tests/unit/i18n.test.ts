import { describe, expect, it } from 'vitest';
import { typeLabel, ui, videoCount } from '../../src/lib/i18n.ts';

describe('videoCount', () => {
  it.each([
    [1, 'ar', 'فيديو واحد'],
    [2, 'ar', 'فيديوهين'],
    [3, 'ar', '3 فيديوهات'],
    [6, 'ar', '6 فيديوهات'],
    [10, 'ar', '10 فيديوهات'],
    [11, 'ar', '11 فيديو'],
    [100, 'ar', '100 فيديو'],
    [1, 'en', '1 video'],
    [6, 'en', '6 videos'],
  ] as const)('%s in %s → %s', (n, lang, want) => {
    expect(videoCount(n, lang)).toBe(want);
  });
});

describe('typeLabel', () => {
  it.each([
    ['reel', 'ar', 'ريل'],
    ['event', 'ar', 'تغطية فعالية'],
    ['brand', 'ar', 'براند'],
    ['film', 'ar', 'سينمائي'],
    ['reel', 'en', 'Reel'],
    ['event', 'en', 'Event'],
    ['brand', 'en', 'Brand'],
    ['film', 'en', 'Film'],
  ] as const)('%s in %s → %s', (type, lang, want) => {
    expect(typeLabel(type, lang)).toBe(want);
  });
});

describe('play button name', () => {
  it.each(['ar', 'en'] as const)('in %s starts with the words on the button, so voice control can say them', (lang) => {
    const t = ui[lang];
    expect(t.playLabel('Title', '0:30').startsWith(t.playWithSound)).toBe(true);
    expect(t.playLabel('Title', '0:30')).toContain('Title');
    expect(t.playLabel('Title', '0:30')).toContain('0:30');
  });
});
