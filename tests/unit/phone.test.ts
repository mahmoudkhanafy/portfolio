import { describe, expect, it } from 'vitest';
import { isFramed, PHONE_SHAPE, pieceOf, SCREEN_SHAPE, SCREEN_SHARE, screenScales } from '../../src/lib/phone.ts';

describe('the phone frame', () => {
  it('holds reels and taller pieces, not 4:5 posts or anything wider', () => {
    expect([9 / 16, 9 / 19.5, 0.59].map(isFramed)).toEqual([true, true, true]);
    expect([0.6, 4 / 5, 1, 16 / 9].map(isFramed)).toEqual([false, false, false, false]);
  });

  it('has a 9:19.5 screen inside the outline measured on the photo', () => {
    expect(PHONE_SHAPE).toBe(0.4796);
    expect(SCREEN_SHARE).toBeCloseTo(0.9272, 4);
    expect(SCREEN_SHAPE).toBeCloseTo(9 / 19.5, 2);
  });

  it('fills the screen at rest and shows the whole picture while it plays', () => {
    const reel = screenScales(9 / 16);
    expect(reel.fill).toBeCloseTo(1.2208, 3);
    expect(reel.whole).toBe(1);
    const recording = screenScales(9 / 19.5);
    expect(recording.fill).toBeCloseTo(1, 2);
    expect(recording.whole).toBe(1);
    const taller = screenScales(9 / 21);
    expect(taller.fill).toBe(1);
    expect(taller.whole).toBeCloseTo(0.93, 3);
  });

  it('counts a framed reel as the phone’s outline in the rows, its play button on the screen', () => {
    expect(pieceOf(9 / 16)).toEqual({ shape: PHONE_SHAPE, screen: SCREEN_SHARE });
    expect(pieceOf(4 / 5)).toEqual({ shape: 4 / 5, screen: 1 });
  });
});
