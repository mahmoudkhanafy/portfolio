import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildMedia, MediaError } from '../../scripts/media/build.ts';
import { runCommand, type Runner } from '../../scripts/media/run.ts';

const ffmpeg = (...args: string[]) => execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args]);

let root: string;
const calls: string[] = [];
const countingRunner: Runner = (command, args, options) => {
  calls.push(command);
  return runCommand(command, args, options);
};

beforeAll(async () => {
  root = mkdtempSync(join(tmpdir(), 'portfolio-media-'));
  mkdirSync(join(root, 'work'));
  mkdirSync(join(root, 'site/brand'), { recursive: true });
  // 1080p landscape with sound, and a 60 fps phone clip rotated to portrait with no audio track.
  ffmpeg('-f', 'lavfi', '-i', 'testsrc2=size=1920x1080:rate=30', '-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=48000', '-t', '2', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', join(root, 'work/landscape.mp4'));
  ffmpeg('-f', 'lavfi', '-i', 'testsrc2=size=1280x720:rate=60', '-t', '2', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', join(root, 'plain.mp4'));
  ffmpeg('-display_rotation', '90', '-i', join(root, 'plain.mp4'), '-c', 'copy', join(root, 'work/Phone Clip.mov'));
  writeFileSync(join(root, 'work/landscape.yml'), 'title: "مشهد عرضي"\ntitle_en: "Landscape"\ntype: film\ncover: "0:01"\norder: 2\n');
  copyFileSync('site/brand/og-wordmark.png', join(root, 'site/brand/og-wordmark.png'));
  await sharp({ create: { width: 400, height: 600, channels: 4, background: { r: 20, g: 20, b: 20, alpha: 0.5 } } }).png().toFile(join(root, 'site/portrait.png'));
}, 60_000);

afterAll(() => {
  rmSync(root, { recursive: true, force: true });
});

describe('buildMedia', () => {
  it('encodes, renders and catalogs every piece', async () => {
    const result = await buildMedia({ root, runner: countingRunner, log: () => {} });
    expect(result.errors).toEqual([]);
    const catalog = JSON.parse(readFileSync(join(root, 'src/generated/catalog.json'), 'utf8'));
    expect(catalog.works.map((w: { slug: string }) => w.slug)).toEqual(['phone-clip', 'landscape']);

    const [phone, landscape] = catalog.works;
    expect(landscape).toMatchObject({ width: 1920, height: 1080, hasAudio: true, type: 'film', title: { ar: 'مشهد عرضي', en: 'Landscape' } });
    expect(landscape.renditions.map((r: { id: string; width: number; height: number }) => [r.id, r.width, r.height])).toEqual([
      ['hd', 1920, 1080],
      ['sd', 1280, 720],
    ]);
    expect(phone).toMatchObject({ width: 720, height: 1280, hasAudio: false, title: { ar: 'Phone Clip' } });
    expect(phone.renditions).toHaveLength(1);

    for (const work of catalog.works) {
      const files = [...work.renditions.map((r: { src: string }) => r.src), ...work.cover.avif.map((s: { src: string }) => s.src), ...work.cover.webp.map((s: { src: string }) => s.src), work.cover.jpg.src, work.og.src];
      for (const src of files) expect(existsSync(join(root, 'public', src)), src).toBe(true);
      expect(work.cover.lqip).toMatch(/^data:image\/webp;base64,/);
      expect(work.cover.color).toMatch(/^#[0-9a-f]{6}$/);
      const og = await sharp(join(root, 'public', work.og.src)).metadata();
      expect([og.width, og.height, og.format]).toEqual([1200, 630, 'jpeg']);
      expect(statSync(join(root, 'public', work.og.src)).size).toBeLessThan(300_000);
    }
    expect(landscape.renditions[0].bytes).toBeGreaterThan(0);
    expect(landscape.renditions[0].bitrate).toBeGreaterThan(0);
    expect(catalog.portrait.avif.length).toBeGreaterThan(0);
    for (const s of catalog.portrait.avif) expect(existsSync(join(root, 'public', s.src))).toBe(true);
    expect(calls).toContain('ffmpeg');
  }, 180_000);

  it('reuses the cache on the next run', async () => {
    calls.length = 0;
    const result = await buildMedia({ root, runner: countingRunner, log: () => {} });
    expect(result.errors).toEqual([]);
    expect(calls.filter((c) => c === 'ffmpeg' || c === 'ffprobe')).toEqual([]);
  }, 60_000);

  it('plans a re-render when the cover time changes', async () => {
    expect((await buildMedia({ root, runner: countingRunner, plan: true, log: () => {} })).needsFfmpeg).toBe(false);
    writeFileSync(join(root, 'work/landscape.yml'), 'title: "مشهد عرضي"\ntype: film\ncover: "0:00.5"\n');
    expect((await buildMedia({ root, runner: countingRunner, plan: true, log: () => {} })).needsFfmpeg).toBe(true);
  }, 60_000);

  it('names a video it cannot read', async () => {
    writeFileSync(join(root, 'work/broken.mp4'), 'this is not a video');
    const run = buildMedia({ root, runner: countingRunner, log: () => {} });
    await expect(run).rejects.toBeInstanceOf(MediaError);
    await expect(run).rejects.toThrow(/work\/broken\.mp4/);
    rmSync(join(root, 'work/broken.mp4'));
  }, 60_000);

  it('reads the videos from another folder when asked, and names files by that folder', async () => {
    const other = join(root, 'other-work');
    mkdirSync(other);
    copyFileSync(join(root, 'work/landscape.mp4'), join(other, 'wide.mp4'));
    writeFileSync(join(other, 'wide.yml'), 'title: "من فولدر تاني"\ntype: film\n');
    const result = await buildMedia({ root, work: 'other-work', runner: countingRunner, log: () => {} });
    expect(result.catalog?.works.map((w) => w.slug)).toEqual(['wide']);
    writeFileSync(join(other, 'broken.mp4'), 'this is not a video');
    await expect(buildMedia({ root, work: 'other-work', runner: countingRunner, log: () => {} })).rejects.toThrow(/other-work\/broken\.mp4/);
  }, 60_000);
});

describe('buildMedia with a video stored squeezed', () => {
  it('shows it at its true 9:16, in every rendition and the cover, with square pixels', async () => {
    const squeezedRoot = mkdtempSync(join(tmpdir(), 'portfolio-squeezed-'));
    try {
      mkdirSync(join(squeezedRoot, 'work'));
      mkdirSync(join(squeezedRoot, 'site/brand'), { recursive: true });
      copyFileSync('site/brand/og-wordmark.png', join(squeezedRoot, 'site/brand/og-wordmark.png'));
      // A 9:16 video scaled into a square: ffmpeg keeps the picture's shape by flagging the pixels 9:16.
      ffmpeg('-f', 'lavfi', '-i', 'testsrc2=size=360x640:rate=30', '-t', '2', '-vf', 'scale=360:360', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', join(squeezedRoot, 'work/squeezed.mp4'));
      writeFileSync(join(squeezedRoot, 'work/squeezed.yml'), 'title: "ريل"\ntype: reel\n');

      const result = await buildMedia({ root: squeezedRoot, runner: runCommand, log: () => {} });
      const work = result.catalog!.works[0]!;
      expect([work.width, work.height]).toEqual([360, 640]);
      expect(work.renditions.map((r) => [r.id, r.width, r.height])).toEqual([['hd', 360, 640]]);
      const probe = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,sample_aspect_ratio', '-of', 'csv=p=0', join(squeezedRoot, 'public', work.renditions[0]!.src)]);
      expect(probe.toString().trim()).toBe('360,640,1:1');
      const cover = await sharp(join(squeezedRoot, 'public', work.cover.jpg.src)).metadata();
      expect([work.cover.width, work.cover.height, cover.width, cover.height]).toEqual([360, 640, 360, 640]);
    } finally {
      rmSync(squeezedRoot, { recursive: true, force: true });
    }
  }, 120_000);
});
