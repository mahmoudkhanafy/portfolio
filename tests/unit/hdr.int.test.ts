import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { buildMedia } from '../../scripts/media/build.ts';
import { runCommand, type Runner } from '../../scripts/media/run.ts';

const ffmpegLists = (what: string, name: string): boolean => {
  try {
    return new RegExp(`\\s${name}\\s`).test(execFileSync('ffmpeg', ['-hide_banner', what], { stdio: ['ignore', 'pipe', 'ignore'] }).toString());
  } catch {
    return false;
  }
};

// Homebrew's ffmpeg has no zscale, so this runs where it does: the Ubuntu runners' apt ffmpeg.
const canRun = ffmpegLists('-filters', 'zscale') && ffmpegLists('-encoders', 'libx265');
let root = '';

afterAll(() => {
  if (root) rmSync(root, { recursive: true, force: true });
});

describe.runIf(canRun)('HDR footage (iPhone HLG)', () => {
  it('is tone-mapped to SDR BT.709 in both renditions and the cover', async () => {
    root = mkdtempSync(join(tmpdir(), 'portfolio-hdr-'));
    mkdirSync(join(root, 'work'));
    mkdirSync(join(root, 'site/brand'), { recursive: true });
    copyFileSync('site/brand/og-wordmark.png', join(root, 'site/brand/og-wordmark.png'));
    execFileSync('ffmpeg', [
      '-hide_banner', '-loglevel', 'error', '-y',
      '-f', 'lavfi', '-i', 'testsrc2=size=1080x1920:rate=30', '-t', '2',
      '-c:v', 'libx265', '-x265-params', 'log-level=error:colorprim=bt2020:transfer=arib-std-b67:colormatrix=bt2020nc',
      '-pix_fmt', 'yuv420p10le', '-color_primaries', 'bt2020', '-color_trc', 'arib-std-b67', '-colorspace', 'bt2020nc', '-tag:v', 'hvc1',
      join(root, 'work/iphone-hlg.mov'),
    ]);
    writeFileSync(join(root, 'work/iphone-hlg.yml'), 'title: "فيديو HDR"\ntype: reel\n');

    const toneMapped: string[] = [];
    const runner: Runner = (command, args, options) => {
      if (args.some((arg) => arg.includes('zscale'))) toneMapped.push(args.at(-1)!);
      return runCommand(command, args, options);
    };
    const result = await buildMedia({ root, runner, log: () => {} });

    expect(result.warnings).toEqual([]);
    expect(toneMapped).toHaveLength(3); // hd, sd and the cover frame
    for (const rendition of result.catalog!.works[0]!.renditions) {
      const probe = JSON.parse(
        execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=codec_name,pix_fmt,color_transfer,color_primaries', '-of', 'json', join(root, 'public', rendition.src)]).toString(),
      );
      expect(probe.streams[0]).toMatchObject({ codec_name: 'h264', pix_fmt: 'yuv420p', color_transfer: 'bt709', color_primaries: 'bt709' });
    }
  }, 180_000);
});
