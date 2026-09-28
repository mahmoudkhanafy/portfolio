import { describe, expect, it } from 'vitest';
import { imageKey, videoKey } from '../../scripts/media/keys.ts';

describe('cache keys', () => {
  it('are short hex strings that repeat for the same inputs', () => {
    expect(videoKey('abc')).toMatch(/^[0-9a-f]{10}$/);
    expect(videoKey('abc')).toBe(videoKey('abc'));
    expect(imageKey('abc', 5, 'b1')).toBe(imageKey('abc', 5, 'b1'));
  });

  it('change when the source changes', () => {
    expect(videoKey('abc')).not.toBe(videoKey('abd'));
    expect(imageKey('abc', 5, 'b1')).not.toBe(imageKey('abd', 5, 'b1'));
  });

  it('re-render images when the cover time or the brand artwork changes', () => {
    expect(imageKey('abc', null, 'b1')).not.toBe(imageKey('abc', 5, 'b1'));
    expect(imageKey('abc', 5, 'b1')).not.toBe(imageKey('abc', 5.5, 'b1'));
    expect(imageKey('abc', 5, 'b1')).not.toBe(imageKey('abc', 5, 'b2'));
  });

  it('keep video and image keys apart for the same source', () => {
    expect(videoKey('abc')).not.toBe(imageKey('abc', null, ''));
  });
});
