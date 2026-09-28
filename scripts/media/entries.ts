import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseDocument } from 'yaml';
import { WORK_TYPES, type WorkType } from '../../src/lib/i18n.ts';
import { parseTime } from '../../src/lib/time.ts';
import { slugify, titleFromFileName } from './slug.ts';

/** A file in work/; `text` is present for info (.yml) files. */
export interface WorkFile {
  name: string;
  text?: string;
}

/** A message for Mahmoud about one file, in both languages. */
export interface Problem {
  file: string;
  en: string;
  ar: string;
}

export interface Entry {
  slug: string;
  videoPath: string;
  infoPath: string | null;
  auto: boolean;
  title: { ar: string; en: string | null };
  description: { ar: string | null; en: string | null };
  type: WorkType;
  client: string | null;
  role: { ar: string | null; en: string | null };
  cover: number | null;
  order: number;
  hidden: boolean;
}

export interface EntriesResult {
  entries: Entry[];
  warnings: Problem[];
  errors: Problem[];
}

export const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.m4v', '.webm', '.mkv', '.avi', '.wmv', '.mpg', '.mpeg', '.3gp', '.mts', '.m2ts'];
const INFO_EXTENSIONS = ['.yml', '.yaml'];
const KNOWN_KEYS = ['title', 'title_en', 'description', 'description_en', 'type', 'client', 'role', 'role_en', 'cover', 'order', 'video', 'hidden'];

const TYPE_SYNONYMS: Record<string, WorkType> = {
  reels: 'reel', short: 'reel', shorts: 'reel', 'ريل': 'reel', 'ريلز': 'reel',
  events: 'event', 'فعالية': 'event', 'فعاليات': 'event', 'تغطية': 'event',
  brands: 'brand', ad: 'brand', ads: 'brand', commercial: 'brand', 'براند': 'brand', 'إعلان': 'brand', 'اعلان': 'brand',
  films: 'film', cinematic: 'film', 'سينمائي': 'film', 'فيلم': 'film',
};
const YES = ['yes', 'y', 'true', 'نعم', 'اه', 'آه'];
const NO = ['no', 'n', 'false', 'لا'];

const extOf = (name: string): string => {
  const dot = name.lastIndexOf('.');
  return dot > 0 ? name.slice(dot).toLowerCase() : '';
};
const stemOf = (name: string): string => {
  const dot = name.lastIndexOf('.');
  return dot > 0 ? name.slice(0, dot) : name;
};
const isIgnored = (name: string): boolean => name.startsWith('.') || name.startsWith('_');
export const isVideoFile = (name: string): boolean => VIDEO_EXTENSIONS.includes(extOf(name));
const isInfoFile = (name: string): boolean => INFO_EXTENSIONS.includes(extOf(name));
const same = (a: string, b: string): boolean => a.toLowerCase() === b.toLowerCase();

const say = (file: string, en: string, ar: string): Problem => ({ file, en, ar });

const messages = {
  yamlSyntax: (file: string, line: number | undefined) => {
    const where = line ? { en: `Line ${line}: `, ar: `السطر ${line}: ` } : { en: '', ar: '' };
    return say(
      file,
      `${where.en}this line isn't written the expected way. Write each field on its own line like  title: "your text"  and keep the text inside double quotes.`,
      `${where.ar}السطر ده مكتوب بشكل غلط. اكتب كل معلومة في سطر لوحدها بالشكل ده  title: "النص"  وخلّي النص جوه علامتين تنصيص "".`,
    );
  },
  duplicateKey: (file: string, line: number | undefined) =>
    say(file, `Line ${line ?? '?'}: this field is written twice. Keep only one of them.`, `السطر ${line ?? '?'}: المعلومة دي مكتوبة مرتين. سيب واحدة بس.`),
  notMapping: (file: string) =>
    say(file, 'This file should contain fields like  title: "..."  one per line.', 'الملف ده لازم يكون فيه معلومات بالشكل ده  title: "..."  كل واحدة في سطر.'),
  missingTitle: (file: string) =>
    say(file, 'The "title" line is missing or empty. Add a line like  title: "Video title".', 'سطر العنوان "title" ناقص أو فاضي. زوّد سطر زي ده  title: "عنوان الفيديو".'),
  notText: (file: string, key: string) =>
    say(file, `"${key}" should be plain text inside double quotes.`, `قيمة "${key}" لازم تكون نص جوه علامتين تنصيص "".`),
  unknownKey: (file: string, key: string, suggestion: string | null) =>
    say(
      file,
      `"${key}" isn't a known field, so it was ignored.${suggestion ? ` Did you mean "${suggestion}"?` : ''}`,
      `"${key}" مش من المعلومات المعروفة، فاتجاهلت.${suggestion ? ` تقصد "${suggestion}"؟` : ''}`,
    ),
  badType: (file: string, value: string) =>
    say(file, `"type" must be one of: ${WORK_TYPES.join(', ')} (found "${value}").`, `قيمة "type" لازم تكون واحدة من: ${WORK_TYPES.join(', ')} (المكتوب: "${value}").`),
  badCover: (file: string, value: string) =>
    say(file, `"cover" must be a time in the video, like 5 or "0:05" (found "${value}").`, `قيمة "cover" لازم تكون وقت في الفيديو زي 5 أو "0:05" (المكتوب: "${value}").`),
  badOrder: (file: string, value: string) =>
    say(file, `"order" must be a number, like 1 or 2.5 (found "${value}").`, `قيمة "order" لازم تكون رقم زي 1 أو 2.5 (المكتوب: "${value}").`),
  badHidden: (file: string, value: string) =>
    say(file, `"hidden" must be yes or no (found "${value}").`, `قيمة "hidden" لازم تكون yes أو no (المكتوب: "${value}").`),
  videoNotFound: (file: string, name: string) =>
    say(
      file,
      `The video "${name}" named in this file isn't in the work folder. Upload it, or fix the name after "video:".`,
      `الفيديو "${name}" المكتوب في الملف ده مش موجود في فولدر work. ارفعه، أو صحّح الاسم اللي بعد "video:".`,
    ),
  notVideoFile: (file: string, name: string) =>
    say(file, `"${name}" isn't a video file. Use an MP4 or MOV export.`, `"${name}" مش ملف فيديو. استخدم ملف MP4 أو MOV.`),
  noVideo: (file: string, stem: string) =>
    say(
      file,
      `No video found for this file. Upload "${stem}.mp4" next to it (any video named ${stem} works), or add a line like  video: "file-name.mp4".`,
      `مفيش فيديو للملف ده. ارفع "${stem}.mp4" جنبه (أي فيديو اسمه ${stem} ينفع)، أو زوّد سطر زي ده  video: "اسم-الملف.mp4".`,
    ),
  doubleClaim: (file: string, video: string, other: string) =>
    say(
      file,
      `The video "${video}" is already used by work/${other}. Each video needs its own info file.`,
      `الفيديو "${video}" مستخدم بالفعل في work/${other}. كل فيديو ليه ملف معلومات واحد بس.`,
    ),
  duplicateSlug: (file: string, slug: string, other: string) =>
    say(
      file,
      `This would get the link /work/${slug}/, which ${other} already uses. Rename one of the two files.`,
      `ده هياخد اللينك /work/${slug}/ واللينك ده مستخدم بالفعل لـ ${other}. غيّر اسم واحد من الملفين.`,
    ),
  autoEntry: (file: string, title: string, stem: string) =>
    say(
      file,
      `Published with the title "${title}" taken from the file name. Add ${stem}.yml next to it to give it a proper title and description.`,
      `اتنشر بعنوان "${title}" من اسم الملف. زوّد ملف ${stem}.yml جنبه عشان تكتب عنوان ووصف مظبوطين.`,
    ),
};

function distance(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let previous = row[0]!;
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const current = row[j]!;
      row[j] = Math.min(row[j]! + 1, row[j - 1]! + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1));
      previous = current;
    }
  }
  return row[b.length]!;
}

function closestKey(key: string): string | null {
  let best: string | null = null;
  let bestDistance = 3;
  for (const known of KNOWN_KEYS) {
    const d = distance(key.toLowerCase(), known);
    if (d < bestDistance) {
      best = known;
      bestDistance = d;
    }
  }
  return best;
}

type Fields = Omit<Entry, 'slug' | 'videoPath' | 'infoPath' | 'auto'> & { video: string | null };

function readFields(source: string, file: string, warnings: Problem[], errors: Problem[]): Fields | null {
  const doc = parseDocument(source.replace(/^\ufeff/, '').replace(/\r\n?/g, '\n'));
  const syntax = doc.errors[0];
  if (syntax) {
    const line = syntax.linePos?.[0]?.line;
    errors.push(syntax.code === 'DUPLICATE_KEY' ? messages.duplicateKey(file, line) : messages.yamlSyntax(file, line));
    return null;
  }
  const data: unknown = doc.toJS() ?? {};
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    errors.push(messages.notMapping(file));
    return null;
  }
  const record = data as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    if (!KNOWN_KEYS.includes(key)) warnings.push(messages.unknownKey(file, key, closestKey(key)));
  }

  let ok = true;
  const fail = (problem: Problem): null => {
    errors.push(problem);
    ok = false;
    return null;
  };
  const text = (key: string): string | null => {
    const value = record[key];
    if (value === null || value === undefined) return null;
    if (typeof value === 'string') return value.trim() || null;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    return fail(messages.notText(file, key));
  };

  const title = text('title');
  if (!title && ok) fail(messages.missingTitle(file));

  let type: WorkType = 'reel';
  if (record.type !== null && record.type !== undefined) {
    const raw = String(record.type).trim();
    const known = WORK_TYPES.find((t) => t === raw.toLowerCase()) ?? TYPE_SYNONYMS[raw.toLowerCase()];
    if (known) type = known;
    else fail(messages.badType(file, raw));
  }

  let cover: number | null = null;
  if (record.cover !== null && record.cover !== undefined) {
    cover = parseTime(record.cover);
    if (cover === null) fail(messages.badCover(file, String(record.cover)));
  }

  let order = 0;
  if (record.order !== null && record.order !== undefined) {
    const raw = record.order;
    const value = typeof raw === 'number' ? raw : typeof raw === 'string' && /^\s*-?\d+(\.\d+)?\s*$/.test(raw) ? Number(raw) : Number.NaN;
    if (Number.isFinite(value)) order = value;
    else fail(messages.badOrder(file, String(raw)));
  }

  let hidden = false;
  if (record.hidden !== null && record.hidden !== undefined) {
    const raw = record.hidden;
    const word = String(raw).trim().toLowerCase();
    if (typeof raw === 'boolean') hidden = raw;
    else if (YES.includes(word)) hidden = true;
    else if (NO.includes(word)) hidden = false;
    else fail(messages.badHidden(file, String(raw)));
  }

  const fields: Fields = {
    title: { ar: title ?? '', en: text('title_en') },
    description: { ar: text('description'), en: text('description_en') },
    type,
    client: text('client'),
    role: { ar: text('role'), en: text('role_en') },
    cover,
    order,
    hidden,
    video: text('video'),
  };
  return ok ? fields : null;
}

/** Turns the files in work/ into entries, collecting bilingual warnings and errors instead of throwing. */
export function buildEntries(files: WorkFile[]): EntriesResult {
  const warnings: Problem[] = [];
  const errors: Problem[] = [];
  const visible = files.filter((f) => !isIgnored(f.name));
  const byName = (a: WorkFile, b: WorkFile) => a.name.localeCompare(b.name);
  const videos = visible.filter((f) => isVideoFile(f.name)).sort(byName).map((f) => f.name);
  const infos = visible.filter((f) => isInfoFile(f.name)).sort(byName);
  const claimedBy = new Map<string, string>();
  const failedStems = new Set<string>();
  const candidates: Entry[] = [];

  function addFromInfo(infoName: string, file: string, fields: Fields): boolean {
    const { video: explicit, ...rest } = fields;
    let videoPath: string | undefined;
    if (explicit) {
      videoPath = videos.find((v) => same(v, explicit));
      if (!videoPath) {
        const exists = visible.some((f) => same(f.name, explicit));
        errors.push(exists && !isVideoFile(explicit) ? messages.notVideoFile(file, explicit) : messages.videoNotFound(file, explicit));
        return false;
      }
    } else {
      videoPath = videos.find((v) => same(stemOf(v), stemOf(infoName)));
      if (!videoPath) {
        errors.push(messages.noVideo(file, stemOf(infoName)));
        return false;
      }
    }
    const owner = claimedBy.get(videoPath.toLowerCase());
    if (owner) {
      errors.push(messages.doubleClaim(file, videoPath, owner));
      return false;
    }
    claimedBy.set(videoPath.toLowerCase(), infoName);
    candidates.push({ slug: slugify(stemOf(infoName)), videoPath, infoPath: infoName, auto: false, ...rest });
    return true;
  }

  for (const info of infos) {
    const file = `work/${info.name}`;
    const errorCount = errors.length;
    const fields = readFields(info.text ?? '', file, warnings, errors);
    const accepted = fields ? addFromInfo(info.name, file, fields) : false;
    if (!accepted || errors.length > errorCount) failedStems.add(stemOf(info.name).toLowerCase());
  }

  // A video whose same-named info file has errors stays unpublished until that file is fixed.
  for (const videoPath of videos) {
    if (claimedBy.has(videoPath.toLowerCase()) || failedStems.has(stemOf(videoPath).toLowerCase())) continue;
    const stem = stemOf(videoPath);
    const title = titleFromFileName(stem);
    candidates.push({
      slug: slugify(stem),
      videoPath,
      infoPath: null,
      auto: true,
      title: { ar: title, en: null },
      description: { ar: null, en: null },
      type: 'reel',
      client: null,
      role: { ar: null, en: null },
      cover: null,
      order: 0,
      hidden: false,
    });
    warnings.push(messages.autoEntry(`work/${videoPath}`, title, stem));
  }

  const bySlug = new Map<string, Entry>();
  const entries: Entry[] = [];
  for (const entry of candidates) {
    const first = bySlug.get(entry.slug);
    if (first) {
      errors.push(messages.duplicateSlug(`work/${entry.infoPath ?? entry.videoPath}`, entry.slug, `work/${first.infoPath ?? first.videoPath}`));
      continue;
    }
    bySlug.set(entry.slug, entry);
    entries.push(entry);
  }
  return { entries, warnings, errors };
}

/** Lists work/ (files only) and reads the info files. A missing folder means no work yet. */
export async function readWorkDir(dir: string): Promise<WorkFile[]> {
  let names: string[];
  try {
    names = (await readdir(dir, { withFileTypes: true })).filter((d) => d.isFile()).map((d) => d.name);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw error;
  }
  return Promise.all(
    names.map(async (name) => (isInfoFile(name) && !isIgnored(name) ? { name, text: await readFile(join(dir, name), 'utf8') } : { name })),
  );
}
