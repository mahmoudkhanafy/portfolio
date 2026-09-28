import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { isHdr, parseProbe } from '../../scripts/media/probe.ts';

const fixture = (name: string): unknown => JSON.parse(readFileSync(new URL(`../fixtures/ffprobe/${name}.json`, import.meta.url), 'utf8'));

describe('parseProbe', () => {
  it('reads a rotated, silent 60 fps phone clip as portrait', () => {
    expect(parseProbe(fixture('rotated-silent'))).toEqual({
      width: 1080,
      height: 1920,
      rotation: 90,
      duration: 1,
      fps: 60,
      hasAudio: false,
      transfer: null,
      bitrate: 8400392,
      codec: 'h264',
      videoBitrate: 8387624,
    });
  });

  // Four of the seed reels arrived like this: 1080×1080 stored, flagged "show as 9:16" (what ffmpeg's
  // scale filter writes when a 9:16 video is squeezed into a square). Players show them at 9:16.
  it('reads a 9:16 video stored squeezed into a square at its true 9:16', () => {
    expect(parseProbe(fixture('squeezed-9x16'))).toMatchObject({ width: 1080, height: 1920, rotation: 0 });
  });

  it('treats pixels of unknown shape as square', () => {
    for (const sample_aspect_ratio of ['0:1', 'N/A', '1:0', undefined]) {
      const probe = parseProbe({ streams: [{ codec_type: 'video', width: 1280, height: 720, sample_aspect_ratio }], format: { duration: '3' } });
      expect([probe.width, probe.height], String(sample_aspect_ratio)).toEqual([1280, 720]);
    }
  });

  it('reads the HEVC 10-bit 4:5 source', () => {
    expect(parseProbe(fixture('hevc10-4x5'))).toMatchObject({ width: 1080, height: 1350, rotation: 0, duration: 28.523, fps: 25, hasAudio: true, transfer: 'bt709' });
  });

  it('reads the video codec and the video-only bitrate', () => {
    expect(parseProbe(fixture('hevc10-4x5'))).toMatchObject({ codec: 'hevc', videoBitrate: 3879113 });
  });

  it('estimates the video bitrate from the file total when the stream does not report one', () => {
    const probe = parseProbe({
      streams: [
        { codec_type: 'video', codec_name: 'vp9', width: 1280, height: 720, avg_frame_rate: '30/1' },
        { codec_type: 'audio', codec_name: 'opus', bit_rate: '96000' },
      ],
      format: { duration: '10', bit_rate: '2096000' },
    });
    expect(probe.videoBitrate).toBe(2000000);
  });

  it('flags HLG as HDR and BT.709 as not', () => {
    expect(isHdr(parseProbe(fixture('hlg')))).toBe(true);
    expect(isHdr(parseProbe(fixture('hevc10-4x5')))).toBe(false);
  });

  it('skips embedded cover art and falls back to the stream frame rate and duration', () => {
    const probe = parseProbe({
      streams: [
        { codec_type: 'video', width: 600, height: 600, disposition: { attached_pic: 1 } },
        { codec_type: 'video', width: 1920, height: 1080, avg_frame_rate: '0/0', r_frame_rate: '30000/1001', duration: '5.5', tags: { rotate: '90' }, disposition: { attached_pic: 0 } },
      ],
      format: {},
    });
    expect(probe.width).toBe(1080);
    expect(probe.height).toBe(1920);
    expect(probe.fps).toBeCloseTo(29.97, 2);
    expect(probe.duration).toBe(5.5);
    expect(probe.bitrate).toBeNull();
  });

  it('refuses a file without a video stream', () => {
    expect(() => parseProbe({ streams: [{ codec_type: 'audio' }], format: { duration: '3' } })).toThrow(/no video/i);
    expect(() => parseProbe({})).toThrow(/no video/i);
  });

  it('refuses a video without a usable duration', () => {
    expect(() => parseProbe({ streams: [{ codec_type: 'video', width: 10, height: 10 }], format: {} })).toThrow(/duration/i);
  });
});
