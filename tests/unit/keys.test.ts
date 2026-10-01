import { describe, expect, it } from 'vitest';
import { imageKey, videoKey } from '../../scripts/media/keys.ts';

describe('cache keys', () => {
  it('are short hex strings that repeat for the same inputs', () => {
    expect(videoKey('abc')).toMatch(/^[0-9a-f]{10}$/);
    expect(videoKey('abc')).toBe(videoKey('abc'));
    expect(imageKey('abc', 5)).toBe(imageKey('abc', 5));
  });

  it('change when the source changes', () => {
    expect(videoKey('abc')).not.toBe(videoKey('abd'));
    expect(imageKey('abc', 5)).not.toBe(imageKey('abd', 5));
  });

  it('re-render images when the cover time changes', () => {
    expect(imageKey('abc', null)).not.toBe(imageKey('abc', 5));
    expect(imageKey('abc', 5)).not.toBe(imageKey('abc', 5.5));
  });

  it('keep video and image keys apart for the same source', () => {
    expect(videoKey('abc')).not.toBe(imageKey('abc', null));
  });
});
