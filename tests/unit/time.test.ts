import { describe, expect, it } from 'vitest';
import { formatDuration, isoDuration, parseTime, timecode } from '../../src/lib/time.ts';

describe('formatDuration', () => {
  it.each([
    [30.548, '0:30'],
    [63.636, '1:03'],
    [19.4, '0:19'],
    [0, '0:00'],
    [59.999, '0:59'],
    [60, '1:00'],
    [3725, '1:02:05'],
    [-4, '0:00'],
  ])('%s s → %s (floored like a player)', (seconds, want) => {
    expect(formatDuration(seconds)).toBe(want);
  });
});

describe('timecode', () => {
  it.each([
    [0, 25, '00:00:00:00'],
    [63.636, 30, '00:01:03:19'],
    [3661.5, 25, '01:01:01:12'],
    [1.04, 25, '00:00:01:01'],
  ])('%s s at %s fps → %s', (seconds, fps, want) => {
    expect(timecode(seconds, fps)).toBe(want);
  });
});

describe('isoDuration', () => {
  it.each([
    [63.636, 'PT1M4S'],
    [19.4, 'PT19S'],
    [3600, 'PT1H'],
    [3725, 'PT1H2M5S'],
    [0.2, 'PT1S'],
  ])('%s s → %s', (seconds, want) => {
    expect(isoDuration(seconds)).toBe(want);
  });
});

describe('parseTime', () => {
  it.each([
    [12, 12],
    [0, 0],
    ['12.5', 12.5],
    ['1:04', 64],
    ['0:05.5', 5.5],
    ['1:02:03', 3723],
    [' 7 ', 7],
    ['١:٠٤', 64],
    ['٣', 3],
  ])('reads %j as %s seconds', (value, want) => {
    expect(parseTime(value)).toBe(want);
  });

  it.each([['abc'], ['1:75'], ['1:2:3:4'], [''], ['-3'], [-3], [Number.NaN], [true], [null], [undefined], ['1,5']])(
    'rejects %j',
    (value) => {
      expect(parseTime(value)).toBeNull();
    },
  );
});
