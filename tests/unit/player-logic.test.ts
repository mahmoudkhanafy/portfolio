import { describe, expect, it } from 'vitest';
import { canPreview, chooseRendition, previewRendition, StallGuard } from '../../src/lib/player-logic.ts';

const square = [
  { id: 'hd' as const, width: 1080, bitrate: 4_500_000 },
  { id: 'sd' as const, width: 720, bitrate: 1_500_000 },
];

describe('chooseRendition', () => {
  it('uses the only rendition there is', () => {
    expect(chooseRendition([{ id: 'hd', width: 640, bitrate: 800_000 }], { cssWidth: 390, dpr: 3 })).toBe('hd');
  });

  it('saves data when the visitor asks for it', () => {
    expect(chooseRendition(square, { cssWidth: 390, dpr: 3, net: { saveData: true } })).toBe('sd');
  });

  it.each(['slow-2g', '2g', '3g'])('goes light on a %s connection', (effectiveType) => {
    expect(chooseRendition(square, { cssWidth: 390, dpr: 3, net: { effectiveType } })).toBe('sd');
  });

  it('goes light when the measured downlink cannot carry hd with headroom', () => {
    // 2 Mb/s * 0.7 = 1.4 Mb/s < 4.5 Mb/s
    expect(chooseRendition(square, { cssWidth: 390, dpr: 3, net: { effectiveType: '4g', downlink: 2 } })).toBe('sd');
  });

  it('keeps hd on a fast phone connection', () => {
    // 10 Mb/s * 0.7 = 7 Mb/s ≥ 4.5 Mb/s; 390 css px * 3 = 1170 px > 720 * 1.15
    expect(chooseRendition(square, { cssWidth: 390, dpr: 3, net: { effectiveType: '4g', downlink: 10 } })).toBe('hd');
  });

  it('picks hd for a full-width phone frame when the network is unknown (iOS)', () => {
    expect(chooseRendition(square, { cssWidth: 390, dpr: 3 })).toBe('hd');
  });

  it('picks sd when the frame is small enough for it to look sharp', () => {
    expect(chooseRendition(square, { cssWidth: 300, dpr: 2 })).toBe('sd'); // 600 ≤ 828
    expect(chooseRendition(square, { cssWidth: 460, dpr: 1 })).toBe('sd');
    expect(chooseRendition(square, { cssWidth: 460, dpr: 2 })).toBe('hd'); // 920 > 828
  });

  it('clamps unusual pixel ratios', () => {
    expect(chooseRendition(square, { cssWidth: 700, dpr: 0.5 })).toBe('sd'); // treated as 1
    expect(chooseRendition(square, { cssWidth: 300, dpr: 4 })).toBe('hd'); // treated as 3 → 900
  });
});

describe('StallGuard', () => {
  it('stays calm while nothing stalls', () => {
    expect(new StallGuard().shouldDowngrade(10_000)).toBe(false);
  });

  it('downgrades after one long stall', () => {
    const guard = new StallGuard();
    guard.waiting(0);
    expect(guard.shouldDowngrade(2_000)).toBe(false);
    expect(guard.shouldDowngrade(2_600)).toBe(true);
  });

  it('forgets a stall once playback resumes', () => {
    const guard = new StallGuard();
    guard.waiting(0);
    guard.playing();
    expect(guard.shouldDowngrade(3_000)).toBe(false);
  });

  it('downgrades after three short stalls within twenty seconds', () => {
    const guard = new StallGuard();
    for (const t of [0, 5_000, 10_000]) {
      guard.waiting(t);
      guard.playing();
    }
    expect(guard.shouldDowngrade(10_500)).toBe(true);
  });

  it('ignores short stalls spread far apart', () => {
    const guard = new StallGuard();
    for (const t of [0, 12_000, 24_000]) {
      guard.waiting(t);
      guard.playing();
    }
    expect(guard.shouldDowngrade(24_500)).toBe(false);
  });
});

describe('canPreview', () => {
  const ok = { reducedMotion: false, saveData: false, interacted: true };
  it('previews once the visitor has interacted', () => {
    expect(canPreview(ok)).toBe(true);
    expect(canPreview({ ...ok, interacted: false })).toBe(false);
  });
  it('never previews under reduced motion or Save-Data', () => {
    expect(canPreview({ ...ok, reducedMotion: true })).toBe(false);
    expect(canPreview({ ...ok, saveData: true })).toBe(false);
  });
});

describe('previewRendition', () => {
  it('previews the lighter file: a muted preview in passing should not spend data on sharpness', () => {
    expect(previewRendition(square)).toBe('sd');
    expect(previewRendition([...square].reverse())).toBe('sd');
  });

  it('uses the only rendition there is', () => {
    expect(previewRendition([{ id: 'hd', width: 640, bitrate: 800_000 }])).toBe('hd');
  });
});
