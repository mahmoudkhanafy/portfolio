import { describe, expect, it } from 'vitest';
import { displaySize, planRenditions } from '../../scripts/media/ladder.ts';

const summary = (w: number, h: number) => planRenditions({ width: w, height: h }).map((r) => [r.id, r.width, r.height, r.maxrateKbps, r.bufsizeKbps]);

describe('planRenditions', () => {
  it('square 1080 → hd 1080² and sd 720²', () => {
    // hd: 1080*1080/1000*3.5 = 4082.4 → 4082; sd: 720*720/1000*3 = 1555.2 → 1555
    expect(summary(1080, 1080)).toEqual([
      ['hd', 1080, 1080, 4082, 8164],
      ['sd', 720, 720, 1555, 3110],
    ]);
  });

  it('4:5 portrait keeps its shape', () => {
    // hd: 1458000/1000*3.5 = 5103; sd 720x900: 648000/1000*3 = 1944
    expect(summary(1080, 1350)).toEqual([
      ['hd', 1080, 1350, 5103, 10206],
      ['sd', 720, 900, 1944, 3888],
    ]);
  });

  it('1080p landscape caps both rates', () => {
    expect(summary(1920, 1080)).toEqual([
      ['hd', 1920, 1080, 6000, 12000],
      ['sd', 1280, 720, 2500, 5000],
    ]);
  });

  it('4K is scaled down to the 1080 class', () => {
    expect(summary(3840, 2160).map((r) => r.slice(0, 3))).toEqual([
      ['hd', 1920, 1080],
      ['sd', 1280, 720],
    ]);
    expect(summary(2160, 3840).map((r) => r.slice(0, 3))).toEqual([
      ['hd', 1080, 1920],
      ['sd', 720, 1280],
    ]);
  });

  it('small sources get one rendition and are never upscaled', () => {
    expect(summary(640, 360)).toEqual([['hd', 640, 360, 1500, 3000]]);
  });

  it('odd sizes become even without growing', () => {
    // hd scale 1080/1081 → 1080 x 1347.75 → 1346; sd scale 720/1081 → 720 x 898.50 → 898
    expect(summary(1081, 1349).map((r) => r.slice(0, 3))).toEqual([
      ['hd', 1080, 1346],
      ['sd', 720, 898],
    ]);
  });

  it('sets audio and frame-rate ceilings per rendition', () => {
    const [hd, sd] = planRenditions({ width: 1920, height: 1080 });
    expect([hd?.audioKbps, hd?.fpsMax, hd?.crf]).toEqual([128, 30, 23]);
    expect([sd?.audioKbps, sd?.fpsMax, sd?.crf]).toEqual([128, 30, 26]);
  });
});

describe('planRenditions with a known source bitrate', () => {
  const rates = (w: number, h: number, source: { videoKbps: number | null; codec: string | null }) =>
    planRenditions({ width: w, height: h }, source).map((r) => [r.id, r.maxrateKbps, r.bufsizeKbps]);

  it('never spends more than the source had on an H.264 upload', () => {
    // hd: 1600 * 1.15 = 1840 (under the 4082 ladder cap); sd: 1840 * 0.6 = 1104 (under 1555)
    expect(rates(1080, 1080, { videoKbps: 1600, codec: 'h264' })).toEqual([
      ['hd', 1840, 3680],
      ['sd', 1104, 2208],
    ]);
  });

  it('gives HEVC sources more room, still within the ladder caps', () => {
    // hd: 3879 * 1.6 = 6206 → ladder cap 5103; sd: min(1944, 5103 * 0.6 = 3062) → 1944
    expect(rates(1080, 1350, { videoKbps: 3879, codec: 'hevc' })).toEqual([
      ['hd', 5103, 10206],
      ['sd', 1944, 3888],
    ]);
  });

  it('keeps a floor for very low-bitrate sources', () => {
    // hd: max(600, 300 * 1.15 = 345) = 600; sd: max(400, 600 * 0.6 = 360) = 400
    expect(rates(1080, 1080, { videoKbps: 300, codec: 'h264' })).toEqual([
      ['hd', 600, 1200],
      ['sd', 400, 800],
    ]);
  });

  it('falls back to the ladder when the source bitrate is unknown', () => {
    expect(rates(1080, 1080, { videoKbps: null, codec: 'h264' })).toEqual([
      ['hd', 4082, 8164],
      ['sd', 1555, 3110],
    ]);
  });
});

describe('displaySize', () => {
  it.each([
    [0, 1920, 1080],
    [90, 1080, 1920],
    [-90, 1080, 1920],
    [180, 1920, 1080],
    [270, 1080, 1920],
  ])('rotation %s → %sx%s', (rotation, width, height) => {
    expect(displaySize({ width: 1920, height: 1080 }, rotation)).toEqual({ width, height });
  });

  // Non-square pixels are stretched along the squeezed side, so no stored detail is thrown away.
  it.each([
    ['a 9:16 video squeezed into a square', 1080, 1080, 0, 9 / 16, 1080, 1920],
    ['HDV, 1440 stored for 1920 shown', 1440, 1080, 0, 4 / 3, 1920, 1080],
    ['widescreen DV', 720, 480, 0, 32 / 27, 853, 480],
    ['a squeezed clip with a quarter turn', 1080, 1080, 90, 9 / 16, 1920, 1080],
  ])('%s', (_, codedWidth, codedHeight, rotation, pixelAspect, width, height) => {
    expect(displaySize({ width: codedWidth, height: codedHeight }, rotation, pixelAspect)).toEqual({ width, height });
  });
});
