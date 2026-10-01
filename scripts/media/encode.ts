import type { RenditionPlan, Size } from './ladder.ts';

const QUIET = ['-hide_banner', '-loglevel', 'error', '-nostdin', '-y'];

/** HDR (HLG/PQ) → SDR BT.709 via zimg; needs an ffmpeg built with zscale. */
const TONEMAP = 'zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,tonemap=tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv';

const round3 = (n: number): number => Math.round(n * 1000) / 1000;

/** ffmpeg arguments for one progressive, web-safe H.264/AAC rendition. */
export function encodeArgs(input: string, output: string, plan: RenditionPlan, opts: { toneMap: boolean }): string[] {
  const filters = [...(opts.toneMap ? [TONEMAP] : []), `scale=${plan.width}:${plan.height}:flags=lanczos`, 'setsar=1', 'format=yuv420p'];
  return [
    ...QUIET,
    '-i', input,
    '-map', '0:v:0',
    '-map', '0:a:0?',
    '-map_metadata', '-1',
    '-map_chapters', '-1',
    '-vf', filters.join(','),
    '-r', '30',
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-profile:v', 'main',
    '-level', '4.1',
    '-preset', 'slow',
    '-crf', String(plan.crf),
    '-maxrate', `${plan.maxrateKbps}k`,
    '-bufsize', `${plan.bufsizeKbps}k`,
    '-force_key_frames', 'expr:gte(t,n_forced*2)',
    '-colorspace', 'bt709',
    '-color_primaries', 'bt709',
    '-color_trc', 'bt709',
    '-color_range', 'tv',
    '-c:a', 'aac',
    '-b:a', `${plan.audioKbps}k`,
    '-ac', '2',
    '-ar', '48000',
    '-movflags', '+faststart',
    output,
  ];
}

/**
 * ffmpeg arguments for the cover still: a chosen second, or ffmpeg's `thumbnail` pick
 * from the opening seconds (skipping the first second, which is often a fade).
 */
export function frameArgs(input: string, output: string, size: Size, opts: { time: number | null; duration: number; toneMap: boolean }): string[] {
  const scale = `scale=${size.width}:${size.height}:flags=lanczos`;
  const tone = opts.toneMap ? [TONEMAP] : [];
  const tail = ['-frames:v', '1', '-update', '1', output];
  if (opts.time !== null) {
    return [...QUIET, '-ss', String(opts.time), '-i', input, '-vf', [...tone, scale].join(','), ...tail];
  }
  const start = round3(Math.min(1, opts.duration * 0.1));
  const window = round3(Math.min(8, opts.duration - start));
  return [...QUIET, '-ss', String(start), '-t', String(window), '-i', input, '-vf', ['thumbnail=90', ...tone, scale].join(','), ...tail];
}
