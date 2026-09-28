import { describe, expect, it } from 'vitest';
import { encodeArgs, frameArgs } from '../../scripts/media/encode.ts';
import type { RenditionPlan } from '../../scripts/media/ladder.ts';

const sd: RenditionPlan = { id: 'sd', width: 720, height: 900, crf: 23, maxrateKbps: 1944, bufsizeKbps: 3888, audioKbps: 96, fpsMax: 30 };
const after = (args: string[], flag: string) => args[args.indexOf(flag) + 1];
const TONEMAP = 'zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,tonemap=tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv';

describe('encodeArgs', () => {
  const args = encodeArgs('in.mov', 'out.mp4', sd, { toneMap: false });

  it('reads the input and writes the output last', () => {
    expect(after(args, '-i')).toBe('in.mov');
    expect(args.at(-1)).toBe('out.mp4');
  });

  it('keeps the first video and optional first audio, drops metadata', () => {
    expect(args.join(' ')).toContain('-map 0:v:0 -map 0:a:0?');
    expect(after(args, '-map_metadata')).toBe('-1');
  });

  it('scales to the plan in 8-bit 4:2:0 with square pixels', () => {
    expect(after(args, '-vf')).toBe('scale=720:900:flags=lanczos,setsar=1,format=yuv420p');
  });

  it('encodes web-safe H.264 with the plan rates and 2-second keyframes', () => {
    expect([after(args, '-c:v'), after(args, '-profile:v'), after(args, '-crf'), after(args, '-maxrate'), after(args, '-bufsize')]).toEqual(['libx264', 'high', '23', '1944k', '3888k']);
    expect(after(args, '-fpsmax')).toBe('30');
    expect(after(args, '-force_key_frames')).toBe('expr:gte(t,n_forced*2)');
    expect([after(args, '-colorspace'), after(args, '-color_primaries'), after(args, '-color_trc')]).toEqual(['bt709', 'bt709', 'bt709']);
  });

  it('encodes stereo AAC and moves the index to the front', () => {
    expect([after(args, '-c:a'), after(args, '-b:a'), after(args, '-ac'), after(args, '-ar')]).toEqual(['aac', '96k', '2', '48000']);
    expect(after(args, '-movflags')).toBe('+faststart');
  });

  it('tone-maps HDR before scaling', () => {
    expect(after(encodeArgs('in', 'out', sd, { toneMap: true }), '-vf')).toBe(`${TONEMAP},scale=720:900:flags=lanczos,setsar=1,format=yuv420p`);
  });
});

describe('frameArgs', () => {
  it('seeks to a chosen second before reading', () => {
    const args = frameArgs('in.mp4', 'cover.png', { width: 1080, height: 1350 }, { time: 4.5, duration: 28.5, toneMap: false });
    expect(args.indexOf('-ss')).toBeLessThan(args.indexOf('-i'));
    expect(after(args, '-ss')).toBe('4.5');
    expect(after(args, '-vf')).toBe('scale=1080:1350:flags=lanczos');
    expect(after(args, '-frames:v')).toBe('1');
    expect(args.at(-1)).toBe('cover.png');
  });

  it('lets ffmpeg pick a representative frame from the opening seconds', () => {
    const args = frameArgs('in.mp4', 'cover.png', { width: 1080, height: 1080 }, { time: null, duration: 28.5, toneMap: false });
    expect([after(args, '-ss'), after(args, '-t')]).toEqual(['1', '8']);
    expect(after(args, '-vf')).toBe('thumbnail=90,scale=1080:1080:flags=lanczos');
  });

  it('scales the automatic window down for very short clips', () => {
    const args = frameArgs('in.mp4', 'cover.png', { width: 720, height: 720 }, { time: null, duration: 3, toneMap: false });
    expect([after(args, '-ss'), after(args, '-t')]).toEqual(['0.3', '2.7']);
  });

  it('tone-maps HDR covers too', () => {
    const args = frameArgs('in.mp4', 'cover.png', { width: 1280, height: 720 }, { time: 2, duration: 10, toneMap: true });
    expect(after(args, '-vf')).toBe(`${TONEMAP},scale=1280:720:flags=lanczos`);
  });
});
