/**
 * Prepares every video in work/ for the web: two MP4 renditions, cover images, a link-preview image,
 * the portrait, and src/generated/catalog.json for the site. Results are cached by content in
 * .media-cache/, so only new or changed files are processed.
 *
 *   node scripts/media/build.ts               build
 *   node scripts/media/build.ts --plan        only report whether ffmpeg is needed (for CI)
 *   node scripts/media/build.ts --work <dir>  take the videos from another folder (the e2e build adds test pieces)
 */
import { createHash } from 'node:crypto';
import { createReadStream, existsSync } from 'node:fs';
import { appendFile, copyFile, link, mkdir, readdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import { join, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { Catalog, Portrait, Work } from '../../src/lib/catalog-types.ts';
import { formatDuration } from '../../src/lib/time.ts';
import { encodeArgs, frameArgs } from './encode.ts';
import { buildEntries, readWorkDir, type Entry, type Problem } from './entries.ts';
import { addedAt } from './git.ts';
import { renderCover, renderOg, renderPortrait, type CoverSet, type FileRef, type PortraitSet } from './images.ts';
import { IMAGE_PIPELINE_VERSION, imageKey, videoKey } from './keys.ts';
import { planRenditions } from './ladder.ts';
import { sortWorks } from './order.ts';
import { isHdr, parseProbe, type Probe } from './probe.ts';
import { CommandError, FFMPEG, FFPROBE, runCommand, type Runner } from './run.ts';

export class MediaError extends Error {
  readonly problems: Problem[];
  constructor(problems: Problem[]) {
    super(problems.map((p) => `${p.file}: ${p.en}`).join('\n'));
    this.name = 'MediaError';
    this.problems = problems;
  }
}

export interface BuildOptions {
  root: string;
  /** The folder of videos and .yml files, relative to root. Defaults to work/. */
  work?: string;
  /** Only report whether any video or image still has to be made (no ffmpeg needed). */
  plan?: boolean;
  runner?: Runner;
  log?: (line: string) => void;
}

export interface BuildResult {
  needsFfmpeg: boolean;
  warnings: Problem[];
  errors: Problem[];
  catalog?: Catalog;
}

interface VideoMeta {
  probe: Probe;
  renditions: Array<{ id: 'hd' | 'sd'; file: string; width: number; height: number; bitrate: number; bytes: number }>;
}

interface ImageMeta {
  cover: CoverSet;
  og: { file: string; bytes: number };
}

interface Job {
  entry: Entry;
  file: string;
  source: string;
  vkey: string;
  ikey: string;
}

const round3 = (n: number): number => Math.round(n * 1000) / 1000;
const sourceRate = (probe: Probe) => ({ videoKbps: probe.videoBitrate ? probe.videoBitrate / 1000 : null, codec: probe.codec });

const problem = {
  unreadable: (file: string): Problem => ({
    file,
    en: `${file} couldn't be read as a video. Export it again as MP4 (H.264) and upload it again.`,
    ar: `مش قادر أقرا ${file} كفيديو. صدّره تاني MP4 (H.264) وارفعه تاني.`,
  }),
  encodeFailed: (file: string, detail: string): Problem => ({
    file,
    en: `${file} couldn't be converted for the web (${detail}). Export it again as MP4 (H.264) and upload it again.`,
    ar: `مش قادر أجهّز ${file} للموقع (${detail}). صدّره تاني MP4 (H.264) وارفعه تاني.`,
  }),
  coverTooLate: (file: string, cover: number, duration: number, used: number): Problem => ({
    file,
    en: `"cover" is ${formatDuration(cover)} but the video is only ${formatDuration(duration)} long, so ${formatDuration(used)} was used.`,
    ar: `وقت "cover" هو ${formatDuration(cover)} لكن مدة الفيديو ${formatDuration(duration)} بس، فاستخدمت ${formatDuration(used)}.`,
  }),
  hdrWithoutZscale: (file: string): Problem => ({
    file,
    en: `${file} is HDR, but this ffmpeg can't convert HDR colours, so they may look washed out. Export it as SDR (Rec. 709) to be safe.`,
    ar: `${file} متصوّر HDR، والـ ffmpeg ده مش بيحوّل ألوان HDR، فممكن تطلع باهتة. صدّره SDR (Rec. 709) أضمن.`,
  }),
  noFfmpeg: (): Problem => ({
    file: 'ffmpeg',
    en: 'ffmpeg is needed to prepare new videos but was not found. On a Mac run: brew install ffmpeg. On Ubuntu: sudo apt-get install ffmpeg. Or set FFMPEG_PATH and FFPROBE_PATH.',
    ar: 'محتاج برنامج ffmpeg عشان أجهّز الفيديوهات الجديدة ومش لاقيه. على الماك: brew install ffmpeg. على Ubuntu: sudo apt-get install ffmpeg.',
  }),
};

class ItemFailure extends Error {
  readonly problem: Problem;
  constructor(item: Problem) {
    super(item.en);
    this.problem = item;
  }
}

async function hashFile(path: string): Promise<string> {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(path)) hash.update(chunk as Buffer);
  return hash.digest('hex');
}

/** "cover-480.avif" + key → "cover-480.<key>.avif": new content gets a new URL, so caches never serve stale media. */
const keyed = (file: string, key: string): string => {
  const dot = file.lastIndexOf('.');
  return `${file.slice(0, dot)}.${key}${file.slice(dot)}`;
};

async function linkOrCopy(from: string, to: string): Promise<void> {
  try {
    await link(from, to);
  } catch {
    await copyFile(from, to);
  }
}

async function readJson<T>(path: string): Promise<T | null> {
  return existsSync(path) ? (JSON.parse(await readFile(path, 'utf8')) as T) : null;
}

/** Writes into a temporary sibling and renames it into place, so an interrupted run never leaves half a cache entry. */
async function inFreshDir<T>(dir: string, fill: (tmp: string) => Promise<T>): Promise<T> {
  const tmp = `${dir}.tmp-${process.pid}`;
  await rm(tmp, { recursive: true, force: true });
  await mkdir(tmp, { recursive: true });
  try {
    const meta = await fill(tmp);
    await writeFile(join(tmp, 'meta.json'), JSON.stringify(meta));
    await rm(dir, { recursive: true, force: true });
    await rename(tmp, dir);
    return meta;
  } catch (error) {
    await rm(tmp, { recursive: true, force: true });
    throw error;
  }
}

export async function buildMedia(options: BuildOptions): Promise<BuildResult> {
  const { root, runner = runCommand, log = (line: string) => console.log(line) } = options;
  const paths = {
    work: resolve(root, options.work ?? 'work'),
    public: join(root, 'public'),
    media: join(root, 'public/media'),
    cache: join(root, '.media-cache'),
    catalog: join(root, 'src/generated/catalog.json'),
    wordmark: join(root, 'site/brand/og-wordmark.png'),
    portrait: join(root, 'site/portrait.png'),
  };
  const cacheDir = (kind: 'video' | 'image' | 'portrait', key: string) => join(paths.cache, kind, key);
  const workLabel = relative(root, paths.work).split(sep).join('/');

  const { entries, warnings, errors } = buildEntries(await readWorkDir(paths.work));
  if (errors.length > 0) throw new MediaError(errors);

  const brandHash = existsSync(paths.wordmark) ? await hashFile(paths.wordmark) : 'no-wordmark';
  const jobs: Job[] = await Promise.all(
    entries
      .filter((entry) => !entry.hidden)
      .map(async (entry) => {
        const source = join(paths.work, entry.videoPath);
        const sourceHash = await hashFile(source);
        return { entry, file: `${workLabel}/${entry.videoPath}`, source, vkey: videoKey(sourceHash), ikey: imageKey(sourceHash, entry.cover, brandHash) };
      }),
  );
  const needsFfmpeg = jobs.some((j) => !existsSync(join(cacheDir('video', j.vkey), 'meta.json')) || !existsSync(join(cacheDir('image', j.ikey), 'meta.json')));
  if (options.plan) return { needsFfmpeg, warnings, errors: [] };

  if (needsFfmpeg) {
    try {
      await runner(FFMPEG, ['-hide_banner', '-version']);
      await runner(FFPROBE, ['-hide_banner', '-version']);
    } catch {
      throw new MediaError([problem.noFfmpeg()]);
    }
  }
  let zscale: boolean | undefined;
  const canToneMap = async (): Promise<boolean> => (zscale ??= /\szscale\s/.test(await runner(FFMPEG, ['-hide_banner', '-filters'])));

  const ensureVideo = async (job: Job): Promise<VideoMeta> => {
    const dir = cacheDir('video', job.vkey);
    const cached = await readJson<VideoMeta>(join(dir, 'meta.json'));
    if (cached) return cached;
    log(`▸ ${job.file}: preparing video`);
    let probe: Probe;
    try {
      probe = parseProbe(JSON.parse(await runner(FFPROBE, ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', job.source])));
    } catch {
      throw new ItemFailure(problem.unreadable(job.file));
    }
    const hdr = isHdr(probe);
    if (hdr && !(await canToneMap())) warnings.push(problem.hdrWithoutZscale(job.file));
    const toneMap = hdr && (await canToneMap());
    return inFreshDir(dir, async (tmp) => {
      const renditions: VideoMeta['renditions'] = [];
      for (const plan of planRenditions(probe, sourceRate(probe))) {
        const out = join(tmp, `${plan.id}.mp4`);
        const started = Date.now();
        try {
          await runner(FFMPEG, encodeArgs(job.source, out, plan, { toneMap }));
        } catch (error) {
          const detail = error instanceof CommandError ? error.stderr.split('\n').at(-1) || error.message : String(error);
          throw new ItemFailure(problem.encodeFailed(job.file, detail));
        }
        const bytes = (await stat(out)).size;
        const format = JSON.parse(await runner(FFPROBE, ['-v', 'error', '-show_format', '-of', 'json', out])) as { format?: { bit_rate?: string } };
        const bitrate = Number(format.format?.bit_rate) || Math.round((bytes * 8) / probe.duration);
        renditions.push({ id: plan.id, file: `${plan.id}.mp4`, width: plan.width, height: plan.height, bitrate, bytes });
        log(`  ${plan.id} ${plan.width}×${plan.height}: ${(bytes / 1e6).toFixed(1)} MB, ${(bitrate / 1e6).toFixed(2)} Mb/s (${((Date.now() - started) / 1000).toFixed(1)} s)`);
      }
      return { probe, renditions };
    });
  };

  const ensureImages = async (job: Job, probe: Probe): Promise<ImageMeta> => {
    const dir = cacheDir('image', job.ikey);
    const cached = await readJson<ImageMeta>(join(dir, 'meta.json'));
    if (cached) return cached;
    log(`▸ ${job.file}: making cover and link preview`);
    let time = job.entry.cover;
    if (time !== null && time >= probe.duration) {
      const used = round3(probe.duration / 2);
      warnings.push(problem.coverTooLate(job.entry.infoPath ? `${workLabel}/${job.entry.infoPath}` : job.file, time, probe.duration, used));
      time = used;
    }
    const toneMap = isHdr(probe) && (await canToneMap());
    const size = planRenditions(probe)[0]!;
    return inFreshDir(dir, async (tmp) => {
      const frame = join(tmp, 'frame.png');
      try {
        await runner(FFMPEG, frameArgs(job.source, frame, size, { time, duration: probe.duration, toneMap }));
      } catch {
        throw new ItemFailure(problem.unreadable(job.file));
      }
      const cover = await renderCover(frame, tmp);
      const bytes = await renderOg(frame, size, paths.wordmark, join(tmp, 'og.jpg'));
      await rm(frame);
      return { cover, og: { file: 'og.jpg', bytes } };
    });
  };

  const ready: Array<{ job: Job; video: VideoMeta; images: ImageMeta }> = [];
  const failures: Problem[] = [];
  for (const job of jobs) {
    try {
      const video = await ensureVideo(job);
      ready.push({ job, video, images: await ensureImages(job, video.probe) });
    } catch (error) {
      if (error instanceof ItemFailure) failures.push(error.problem);
      else throw error;
    }
  }
  if (failures.length > 0) throw new MediaError(failures);

  let portraitSet: PortraitSet | null = null;
  let portraitKey = '';
  if (existsSync(paths.portrait)) {
    portraitKey = createHash('sha256').update(`portrait:v${IMAGE_PIPELINE_VERSION}:${await hashFile(paths.portrait)}`).digest('hex').slice(0, 10);
    const dir = cacheDir('portrait', portraitKey);
    portraitSet = (await readJson<PortraitSet>(join(dir, 'meta.json'))) ?? (await inFreshDir(dir, (tmp) => renderPortrait(paths.portrait, tmp)));
  }

  // Publish: public/media is rebuilt from the cache on every run, with content keys in the file names.
  await rm(paths.media, { recursive: true, force: true });
  const publish = async (kind: 'video' | 'image' | 'portrait', key: string, file: string, folder: string): Promise<string> => {
    const target = `media/${folder}/${keyed(file, key)}`;
    await mkdir(join(paths.public, 'media', folder), { recursive: true });
    await linkOrCopy(join(cacheDir(kind, key), file), join(paths.public, target));
    return target;
  };
  const sources = (refs: FileRef[], key: string, folder: string, kind: 'image' | 'portrait') =>
    Promise.all(refs.map(async (ref) => ({ src: await publish(kind, key, ref.file, folder), width: ref.width })));

  const works: Work[] = [];
  for (const { job, video, images } of ready) {
    const { entry } = job;
    const { probe } = video;
    works.push({
      slug: entry.slug,
      title: entry.title,
      description: entry.description,
      type: entry.type,
      client: entry.client,
      role: entry.role,
      order: entry.order,
      addedAt: await addedAt(job.source, root, runner),
      width: probe.width,
      height: probe.height,
      duration: round3(probe.duration),
      fps: round3(probe.fps),
      hasAudio: probe.hasAudio,
      renditions: await Promise.all(
        video.renditions.map(async (r) => ({ id: r.id, src: await publish('video', job.vkey, r.file, entry.slug), width: r.width, height: r.height, bitrate: r.bitrate, bytes: r.bytes })),
      ),
      cover: {
        width: images.cover.width,
        height: images.cover.height,
        color: images.cover.color,
        lqip: images.cover.lqip,
        avif: await sources(images.cover.avif, job.ikey, entry.slug, 'image'),
        webp: await sources(images.cover.webp, job.ikey, entry.slug, 'image'),
        jpg: { src: await publish('image', job.ikey, images.cover.jpg.file, entry.slug), width: images.cover.jpg.width },
      },
      og: { src: await publish('image', job.ikey, images.og.file, entry.slug), width: 1200, height: 630, bytes: images.og.bytes },
    });
  }

  let portrait: Portrait | null = null;
  if (portraitSet) {
    portrait = {
      width: portraitSet.width,
      height: portraitSet.height,
      avif: await sources(portraitSet.avif, portraitKey, 'portrait', 'portrait'),
      webp: await sources(portraitSet.webp, portraitKey, 'portrait', 'portrait'),
      png: { src: await publish('portrait', portraitKey, portraitSet.png.file, 'portrait'), width: portraitSet.png.width },
    };
  }

  const catalog: Catalog = { works: sortWorks(works), portrait };
  await mkdir(join(root, 'src/generated'), { recursive: true });
  await writeFile(paths.catalog, `${JSON.stringify(catalog, null, 2)}\n`);

  // Drop cache entries nothing uses any more, so the CI cache stays small.
  const used = {
    video: new Set(ready.map((r) => r.job.vkey)),
    image: new Set(ready.map((r) => r.job.ikey)),
    portrait: new Set(portraitKey ? [portraitKey] : []),
  };
  for (const kind of ['video', 'image', 'portrait'] as const) {
    const dir = join(paths.cache, kind);
    if (!existsSync(dir)) continue;
    for (const name of await readdir(dir)) {
      if (!used[kind].has(name)) await rm(join(dir, name), { recursive: true, force: true });
    }
  }

  return { needsFfmpeg, warnings, errors: [], catalog };
}

// ——— command line ———

const describe = (p: Problem, kind: 'error' | 'warning'): string => {
  if (process.env.GITHUB_ACTIONS === 'true') {
    const clean = (text: string) => text.replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
    return `::${kind} file=${p.file},title=${kind === 'error' ? 'Video not published' : 'Check this file'}::${clean(`${p.en}\n${p.ar}`)}`;
  }
  return `${kind === 'error' ? '✗' : '!'} ${p.file}\n  ${p.en}\n  ${p.ar}`;
};

async function summarize(problems: Problem[], kind: 'error' | 'warning'): Promise<void> {
  const summary = process.env.GITHUB_STEP_SUMMARY;
  if (!summary || problems.length === 0) return;
  const heading = kind === 'error' ? '### ✗ Videos not published / فيديوهات ما اتنشرتش' : '### ! Check these files / راجع الملفات دي';
  const lines = problems.map((p) => `- **${p.file}**<br>${p.en}<br><span dir="rtl">${p.ar}</span>`);
  await appendFile(summary, `${heading}\n\n${lines.join('\n')}\n\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const plan = process.argv.includes('--plan');
  const at = process.argv.indexOf('--work');
  const work = at > -1 ? process.argv[at + 1] : undefined;
  try {
    const result = await buildMedia({ root: process.cwd(), work, plan });
    for (const w of result.warnings) console.warn(describe(w, 'warning'));
    await summarize(result.warnings, 'warning');
    if (plan) {
      console.log(`needs-ffmpeg=${result.needsFfmpeg}`);
      if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `needs-ffmpeg=${result.needsFfmpeg}\n`);
    } else {
      console.log(`✓ ${result.catalog?.works.length ?? 0} videos ready in public/media`);
    }
  } catch (error) {
    if (!(error instanceof MediaError)) throw error;
    for (const p of error.problems) console.error(describe(p, 'error'));
    await summarize(error.problems, 'error');
    process.exitCode = 1;
  }
}
