# Mahmoud Khaled Portfolio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A fast, Arabic-first, statically hosted video portfolio where every piece has its own previewable link, plays smoothly on phones, and leads to a one-tap WhatsApp message; Mahmoud adds work by uploading files to `work/`.

**Architecture:** A Node media pipeline (ffmpeg + sharp) turns `work/` into content-addressed renditions, covers, OG images and `src/generated/catalog.json`. Astro 7 renders static pages in Arabic (root) and English (`/en/`) from that catalog under a configurable base path. A ~4 KB progressive-enhancement player picks a rendition and guards against stalls.

**Tech Stack:** Node ≥ 22.12 (CI: 24), Astro 7, TypeScript 6 (erasable syntax; scripts run by Node type stripping), Vitest 5, Playwright 1.63 + axe, sharp 0.35, yaml 2, ffmpeg/ffprobe, GitHub Actions + Pages.

**Spec:** `docs/superpowers/specs/2026-09-23-portfolio-design.md`

## Global Constraints

- Site languages: Arabic default at `/` (`lang="ar" dir="rtl"`), English at `/en/`; every page links to its twin.
- Base path from `BASE_PATH` (default `/mahmoud-khaled/`), origin from `SITE_URL` (default `http://localhost:4747`); every internal URL goes through `withBase`, every meta URL through `absoluteUrl`.
- `trailingSlash: 'always'`, `build.format: 'directory'`.
- Contact: WhatsApp `https://wa.me/201156379179`, phone `+20 115 637 9179`, email `mahmoud.kh.hanafy@gmail.com`, Instagram `https://www.instagram.com/mahmoud_khaled.0/`.
- Tools listed exactly: Premiere Pro, After Effects, DaVinci Resolve, Photoshop.
- No invented metrics, dates, client counts or roles. `role` stays empty for the six seed pieces.
- No third-party network requests from the site. Font: `@fontsource-variable/alexandria` only.
- Palette ("Caption"): screen `#000000`, white `#FFFFFF`, text `#D6D6D6`, dim `#8F8F8F`, caption gold `#E8B100`, rule `#2A2A2A`; dark only; `<meta name="darkreader-lock">`.
- No `letter-spacing` on Arabic text, no all-caps labels, no middle-dot meta strings; Latin digits for durations and phone numbers.
- Delivery video: H.264 High + AAC-LC, `yuv420p`, `+faststart`, BT.709 tags; `hd` ≤ 1080 short side, `sd` ≤ 720 short side.
- OG images 1200×630 JPEG < 300 KB, absolute URLs.
- Local server port 4747 (never 4321/4322); e2e port 4748.
- Commits: no attribution lines, never mention an assistant.

## Review Focus

1. **Upload names Mahmoud will actually use** ("فيديو جديد.mp4", "Final Cut (2).MOV"): must yield a valid ASCII slug and match extensions case-insensitively → tests in Task 3.
2. **Hand-written YAML mistakes** (unquoted colon, tab indentation, typo'd key, Arabic-Indic digits in `cover`): must produce a bilingual message naming the file and line, suggest the intended key, and accept Arabic digits → tests in Tasks 2 and 3.
3. **Phone footage** (rotation metadata, HLG/PQ HDR, no audio track, odd dimensions, 60 fps): correct display size, tone-map filter chosen, silent output encodes → tests in Tasks 3 and 5.
4. **Text with quotes, `<`, `&`, `</script>`, emoji or very long Arabic**: escaped in HTML and JSON-LD, no horizontal overflow at 320 px → unit test in Task 4, e2e in Task 10.
5. **Shared URLs as they arrive** (no trailing slash, `?utm_source=ig`/`fbclid` appended by Instagram): page loads, canonical stays clean → server tests in Task 9, e2e in Task 10.

---

## File structure

```
work/                         content (videos + <slug>.yml + _template.yml)
site/portrait.png             trimmed portrait master (1200 px wide)
site/brand/og-wordmark.png    rendered once, used in per-video OG images
site/brand/templates/*.html   sources for brand renders
public/                       favicon.svg, icons, og-home.jpg (committed); media/ (generated, ignored)
scripts/media/slug.ts         slugify, titleFromFileName
scripts/media/entries.ts      read/validate work/ → Entry[] + bilingual problems
scripts/media/ladder.ts       rendition sizes and rates
scripts/media/probe.ts        ffprobe JSON → Probe
scripts/media/encode.ts       ffmpeg argument builders + runner
scripts/media/images.ts       cover set, LQIP, dominant colour, OG, portrait
scripts/media/keys.ts         cache keys
scripts/media/build.ts        orchestrator (CLI: --plan)
scripts/brand/render.ts       Playwright renders of brand assets
scripts/serve.ts              GitHub-Pages-like static server with Range
src/lib/time.ts               formatDuration, timecode, isoDuration, parseTime
src/lib/urls.ts               normalizeBase, withBase, absoluteUrl, pagePath, Lang
src/lib/contact.ts            CONTACT, whatsappUrl, whatsappMessage
src/lib/i18n.ts               UI strings, typeLabel, videoCount
src/lib/player-logic.ts       chooseRendition, StallGuard
src/lib/jsonld.ts             safe JSON-LD serialisation + builders
src/lib/catalog.ts            typed catalog access
src/lib/site.ts               Astro-bound helpers (href, abs, page)
src/scripts/*.ts              player, hero timecode, share, fab
src/styles/global.css         tokens + base
src/layouts/Base.astro        head/meta/OG/JSON-LD/fonts/header/footer
src/components/*.astro        Header, Footer, Hero, WorkFeed, WorkCard, Player, About, Contact, Fab, Icon, MoreWork, LangSwitch
src/pages/...                 [...lang]/index, [...lang]/work/[slug], 404, robots.txt, vcf, manifest
tests/unit, tests/e2e, tests/fixtures
```

---

### Task 1: Scaffold and tooling

**Files:** Create `package.json`, `astro.config.ts`, `tsconfig.json`, `vitest.config.ts`, `.gitignore`, `.editorconfig`, `.nvmrc`, `src/pages/[...lang]/index.astro` (placeholder), `tests/unit/smoke.test.ts`.

**Interfaces:** Produces npm scripts used by every later task:
`media`, `dev`, `build`, `build:e2e`, `preview`, `check`, `test`, `test:unit`, `test:e2e`, `brand`, `lighthouse`, `serve`.

- [ ] **Step 1:** `npm init`, then install: `astro@7 @astrojs/sitemap yaml sharp @fontsource-variable/alexandria @fontsource-variable/handjet` and dev `typescript@6 @astrojs/check vitest @playwright/test @axe-core/playwright lighthouse`.
- [ ] **Step 2:** `astro.config.ts`:

```ts
import { defineConfig, fontProviders } from 'astro/config';
import sitemap from '@astrojs/sitemap';

const site = (process.env.SITE_URL || 'http://localhost:4747').replace(/\/+$/, '');
const rawBase = process.env.BASE_PATH ?? '/mahmoud-khaled/';
const base = rawBase.trim().replace(/^\/+|\/+$/g, '') ? `/${rawBase.trim().replace(/^\/+|\/+$/g, '')}/` : '/';
const npm = fontProviders.npm({ remote: false });

export default defineConfig({
  site, base,
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'always' },
  outDir: process.env.OUT_DIR || 'dist',
  server: { port: 4747, host: true },
  integrations: [sitemap({ i18n: { defaultLocale: 'ar', locales: { ar: 'ar-EG', en: 'en' } } })],
  fonts: [
    { provider: npm, name: 'Alexandria', cssVariable: '--font-sans', weights: ['100 900'], styles: ['normal'], subsets: ['arabic', 'latin'], fallbacks: ['sans-serif'], options: { package: '@fontsource-variable/alexandria' } },
    { provider: npm, name: 'Handjet', cssVariable: '--font-mono', weights: ['100 900'], styles: ['normal'], subsets: ['latin'], fallbacks: ['monospace'], options: { package: '@fontsource-variable/handjet' } },
  ],
});
```

- [ ] **Step 3:** `tsconfig.json` extends `astro/tsconfigs/strict`, adds `allowImportingTsExtensions`, `erasableSyntaxOnly`, `verbatimModuleSyntax`, `resolveJsonModule`, includes `scripts`, `src`, `tests`.
- [ ] **Step 4:** Smoke test `expect(1 + 1).toBe(2)`; run `npm run test:unit` → PASS; `npx astro build` with the placeholder page → `dist/mahmoud-khaled/`… (Astro writes to `dist/` root; base only affects URLs).
- [ ] **Step 5:** Commit "Scaffold Astro project and tooling".

### Task 2: Shared pure helpers (time, urls, contact, i18n counts)

**Files:** Create `src/lib/time.ts`, `src/lib/urls.ts`, `src/lib/contact.ts`, `src/lib/i18n.ts` (only `videoCount`, `typeLabel` for now); tests `tests/unit/time.test.ts`, `urls.test.ts`, `contact.test.ts`, `i18n.test.ts`.

**Interfaces (produced):**
- `formatDuration(seconds: number): string` — floor, `m:ss` / `h:mm:ss`.
- `timecode(seconds: number, fps?: number): string` — `HH:MM:SS:FF`.
- `isoDuration(seconds: number): string` — `PT1M4S`.
- `parseTime(value: unknown): number | null` — numbers, `"12.5"`, `"1:04"`, `"0:05.5"`, `"1:02:03"`, Arabic-Indic digits.
- `type Lang = 'ar' | 'en'`; `normalizeBase(base)`, `withBase(path, base)`, `absoluteUrl(path, site, base)`, `pagePath(lang, slug?)`.
- `CONTACT`, `whatsappUrl(text?)`, `whatsappMessage(lang, work?: { title: string; url: string })`.
- `type WorkType = 'reel' | 'event' | 'brand' | 'film'`; `videoCount(n, lang)`, `typeLabel(type, lang)`.

- [ ] **Step 1: Failing tests** (excerpt; full expectations):

```ts
expect(formatDuration(30.548)).toBe('0:30'); expect(formatDuration(63.636)).toBe('1:03');
expect(formatDuration(3725)).toBe('1:02:05'); expect(formatDuration(-4)).toBe('0:00');
expect(timecode(63.636, 30)).toBe('00:01:03:19'); expect(timecode(3661.5, 25)).toBe('01:01:01:12');
expect(isoDuration(63.636)).toBe('PT1M4S'); expect(isoDuration(3600)).toBe('PT1H');
expect(parseTime('1:04')).toBe(64); expect(parseTime('0:05.5')).toBe(5.5); expect(parseTime('١:٠٤')).toBe(64);
expect(parseTime('1:75')).toBeNull(); expect(parseTime('abc')).toBeNull(); expect(parseTime(-3)).toBeNull();
expect(normalizeBase('mahmoud-khaled')).toBe('/mahmoud-khaled/'); expect(normalizeBase('')).toBe('/');
expect(withBase('/media/a.mp4', '/repo')).toBe('/repo/media/a.mp4');
expect(absoluteUrl('work/x/', 'https://u.github.io/', '/repo/')).toBe('https://u.github.io/repo/work/x/');
expect(pagePath('en', 'x')).toBe('en/work/x/'); expect(pagePath('ar')).toBe('');
expect(whatsappUrl('a b\nc')).toBe('https://wa.me/201156379179?text=a%20b%0Ac');
expect(whatsappMessage('ar', { title: 'X', url: 'https://e/x/' })).toContain('«X»');
expect(videoCount(6, 'ar')).toBe('6 فيديوهات'); expect(videoCount(11, 'ar')).toBe('11 فيديو');
expect(videoCount(2, 'ar')).toBe('فيديوهين'); expect(videoCount(1, 'en')).toBe('1 video');
```

- [ ] **Step 2:** Run → FAIL (modules missing).
- [ ] **Step 3:** Implement (reference implementation for the two non-obvious ones):

```ts
export function parseTime(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) && value >= 0 ? value : null;
  if (typeof value !== 'string') return null;
  const text = value.trim().replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
  if (!/^\d+(?::\d{1,2}){0,2}(?:\.\d+)?$/.test(text)) return null;
  const parts = text.split(':').map(Number);
  if (parts.slice(1).some((p) => p >= 60)) return null;
  return parts.reduce((acc, p) => acc * 60 + p, 0);
}

export function videoCount(n: number, lang: Lang): string {
  if (lang === 'en') return `${n} ${n === 1 ? 'video' : 'videos'}`;
  switch (new Intl.PluralRules('ar').select(n)) {
    case 'one': return 'فيديو واحد';
    case 'two': return 'فيديوهين';
    case 'few': return `${n} فيديوهات`;
    default: return `${n} فيديو`;
  }
}
```

- [ ] **Step 4:** Run → PASS. **Step 5:** Commit "Add time, URL, contact and plural helpers".

### Task 3: Content entries — discovery and validation

**Files:** Create `scripts/media/slug.ts`, `scripts/media/entries.ts`, `tests/unit/slug.test.ts`, `tests/unit/entries.test.ts`.

**Interfaces (produced):**

```ts
export interface Problem { file: string; en: string; ar: string }
export interface Entry {
  slug: string; videoPath: string; infoPath: string | null; auto: boolean;
  title: { ar: string; en: string | null }; description: { ar: string | null; en: string | null };
  type: WorkType; client: string | null; role: { ar: string | null; en: string | null };
  cover: number | null; order: number; hidden: boolean;
}
export function buildEntries(files: Array<{ name: string; text?: string }>): { entries: Entry[]; warnings: Problem[]; errors: Problem[] };
export async function readWorkDir(dir: string): Promise<Array<{ name: string; text?: string }>>;
export function slugify(name: string): string;           // ASCII slug, 'video-xxxxxx' fallback
export function titleFromFileName(stem: string): string;
```

Rules: ignore names starting with `.`/`_` and non-video non-yml files; video extensions (case-insensitive) mp4 mov m4v webm mkv avi wmv mpg mpeg 3gp mts m2ts; YAML via `parseDocument` (errors carry `linePos`); known keys `title title_en description description_en type client role role_en cover order video hidden` (unknown → warning with nearest known key, Levenshtein ≤ 2); `title` required in a `.yml`; `type` accepts synonyms (`reels`, `events`, `ad`, `cinematic`, `ريل`, `ريلز`, `فعالية`, `تغطية`, `براند`, `إعلان`, `اعلان`, `سينمائي`, `فيلم`); `cover` via `parseTime`; `order` must be a finite number; `hidden` accepts booleans and yes/no/true/false; `video` must name an existing file; otherwise same stem (case-insensitive); duplicate slugs and doubly-claimed videos are errors; unclaimed videos become `auto` entries with a warning.

- [ ] **Step 1: Failing tests** covering every rule above, including Review Focus 1–2:

```ts
const yml = (name: string, text: string) => ({ name, text });
it('pairs same-stem files', () => {
  const r = buildEntries([{ name: 'a.mp4' }, yml('a.yml', 'title: "عنوان"')]);
  expect(r.errors).toEqual([]); expect(r.entries[0]).toMatchObject({ slug: 'a', videoPath: 'a.mp4', type: 'reel', order: 0, hidden: false, auto: false });
});
it('publishes an Arabic-named upload with a safe slug', () => {
  const r = buildEntries([{ name: 'فيديو جديد.MP4' }]);
  expect(r.entries[0].slug).toMatch(/^video-[0-9a-f]{6}$/); expect(r.entries[0].title.ar).toBe('فيديو جديد'); expect(r.warnings).toHaveLength(1);
});
it('reports YAML syntax errors with the line', () => {
  const r = buildEntries([{ name: 'n.mp4' }, yml('n.yml', 'type: event\ntitle: NIMUN: recap')]);
  expect(r.errors[0].file).toBe('work/n.yml'); expect(r.errors[0].en).toMatch(/line 2/); expect(r.errors[0].ar).toMatch(/السطر 2/);
});
it('suggests the intended key', () => {
  const r = buildEntries([{ name: 'n.mp4' }, yml('n.yml', 'titel: "x"')]);
  expect(r.warnings[0].en).toMatch(/Did you mean "title"/); expect(r.errors[0].en).toMatch(/title/);
});
it('accepts Arabic digits and synonyms', () => {
  const r = buildEntries([{ name: 'n.mov' }, yml('n.yml', 'title: "x"\ncover: "٠:٠٥"\ntype: فعالية')]);
  expect(r.entries[0]).toMatchObject({ cover: 5, type: 'event' });
});
// plus: explicit video field with spaces; missing video → error naming "n.mp4"; unknown type lists allowed values;
// bad order; hidden yes; duplicate slug; two ymls claiming one video; _template.yml / .DS_Store / README.md ignored;
// slugify('Muscle Up FINAL (2)') === 'muscle-up-final-2'; slugify('Café Día') === 'cafe-dia'; 60-char cap without trailing dash.
```

- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement. **Step 4:** Run → PASS.
- [ ] **Step 5:** Commit "Add work folder discovery and validation".

### Task 4: Media planning — ladder, probe parsing, encode args, keys, ordering, JSON-LD safety

**Files:** Create `scripts/media/ladder.ts`, `scripts/media/probe.ts`, `scripts/media/encode.ts` (pure builders), `scripts/media/keys.ts`, `scripts/media/order.ts`, `src/lib/jsonld.ts`; fixtures `tests/fixtures/ffprobe/{hevc10-4x5.json,rotated-silent.json,hlg.json}`; tests `ladder.test.ts`, `probe.test.ts`, `encode.test.ts`, `keys.test.ts`, `order.test.ts`, `jsonld.test.ts`.

**Interfaces (produced):**

```ts
export interface Size { width: number; height: number }
export interface RenditionPlan { id: 'hd' | 'sd'; width: number; height: number; crf: number; maxrateKbps: number; bufsizeKbps: number; audioKbps: number; fpsMax: number }
export const even: (n: number) => number;                       // floor to even, min 2
export function displaySize(coded: Size, rotation?: number): Size;
export function planRenditions(src: Size): RenditionPlan[];     // [hd] or [hd, sd]
export interface Probe { width: number; height: number; rotation: number; duration: number; fps: number; hasAudio: boolean; transfer: string | null; bitrate: number | null }
export function parseProbe(json: unknown): Probe;               // throws Error('no video stream')
export const isHdr: (p: Probe) => boolean;                      // arib-std-b67 | smpte2084
export function encodeArgs(input: string, output: string, plan: RenditionPlan, opts: { toneMap: boolean }): string[];
export function frameArgs(input: string, output: string, size: Size, opts: { time: number | null; duration: number; toneMap: boolean }): string[];
export function videoKey(sourceHash: string): string;           // 10 hex
export function imageKey(sourceHash: string, cover: number | null, brandHash: string): string;
export function sortWorks<T extends { order: number; addedAt: string; slug: string }>(items: T[]): T[];
export function jsonLdScript(data: unknown): string;            // JSON with <, >, & and U+2028/9 escaped
```

Ladder rules: `hd = fit(1080 short, 1920 long)`, `sd = fit(720, 1280)`, never upscale, even dimensions (floor); `hd` maxrate `clamp(area/1000*3.5, 1500, 6000)`, `sd` `clamp(area/1000*3, 800, 2500)`, bufsize ×2; audio 128/96 kb/s; `fpsMax` 60/30; single rendition when `sd` equals `hd`.

Encode args must contain: `-map 0:v:0 -map 0:a:0?`, `-map_metadata -1`, scale to plan size with lanczos, `setsar=1`, `format=yuv420p`, tone-map chain `zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,tonemap=tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv` only when `toneMap`, `-fpsmax`, `libx264 -preset slow -profile:v high`, `-crf`, `-maxrate`, `-bufsize`, `-force_key_frames expr:gte(t,n_forced*2)`, BT.709 colour tags, `aac -ac 2 -ar 48000`, `-movflags +faststart`.

Frame args: with `time` → `-ss time` before `-i`; without → `-ss min(1, 10%)` and `thumbnail=90` filter over up to 8 s.

- [ ] **Step 1:** Capture fixtures with real ffprobe: the seed `reel4.mov`; a generated rotated silent clip (`ffmpeg -f lavfi -i testsrc2=size=1920x1080:rate=60 -t 1 … -display_rotation 90`); an HLG-tagged clip (`-color_trc arib-std-b67`).
- [ ] **Step 2: Failing tests**, e.g.:

```ts
expect(planRenditions({ width: 1080, height: 1350 }).map((r) => [r.id, r.width, r.height, r.maxrateKbps])).toEqual([['hd', 1080, 1350, 5103], ['sd', 720, 900, 1944]]);
expect(planRenditions({ width: 3840, height: 2160 })[0]).toMatchObject({ width: 1920, height: 1080, maxrateKbps: 6000 });
expect(planRenditions({ width: 640, height: 360 })).toHaveLength(1);
expect(planRenditions({ width: 1081, height: 1349 })[0]).toMatchObject({ width: 1080, height: 1346 });
expect(parseProbe(rotatedSilent)).toMatchObject({ width: 1080, height: 1920, rotation: -90, hasAudio: false, fps: 60 });
expect(isHdr(parseProbe(hlg))).toBe(true);
expect(encodeArgs('in', 'out', sd, { toneMap: false }).join(' ')).toContain('scale=720:900:flags=lanczos,setsar=1,format=yuv420p');
expect(encodeArgs('in', 'out', sd, { toneMap: true }).join(' ')).toContain('tonemap=tonemap=hable');
expect(sortWorks([{ slug: 'old', order: 1, addedAt: '2026-01-01T00:00:00.000Z' }, { slug: 'new', order: 0, addedAt: '2026-09-01T00:00:00.000Z' }]).map((w) => w.slug)).toEqual(['new', 'old']);
expect(jsonLdScript({ name: '</script><b>' })).not.toContain('</script>');
```

- [ ] **Step 3:** Run → FAIL. **Step 4:** Implement. **Step 5:** Run → PASS. **Step 6:** Commit "Add rendition ladder, probe parsing and encode planning".

### Task 5: Design foundation and brand assets

**Files:** Create `src/styles/global.css`, `src/lib/i18n.ts` (full UI dictionary), `src/lib/site.ts`, `src/components/Icon.astro`, `public/favicon.svg`, `site/brand/templates/{wordmark,icon,og-home}.html`, `scripts/brand/render.ts`; outputs `site/brand/og-wordmark.png`, `public/{apple-touch-icon.png,icon-192.png,icon-512.png,icon-maskable-512.png}` (og-home rendered in Task 8).

- [ ] **Step 1:** Load `frontend-design:frontend-design`; lock tokens in `global.css`: colours (`--ink #0f0e0c`, `--ink-2`, `--line`, `--paper #f2ede4`, `--sand` muted text ≥ 4.5:1 on ink, `--tally` ≥ 3:1 for UI and focus), spacing and type scales with `clamp()`, radii, easing, `:focus-visible` ring, reduced-motion block, `@view-transition { navigation: auto; }`.
- [ ] **Step 2:** Contrast unit test (`tests/unit/contrast.test.ts`) reading the token values and asserting WCAG ratios: paper/ink ≥ 7, sand/ink ≥ 4.5, tally/ink ≥ 3, ink on tally button ≥ 4.5.
- [ ] **Step 3:** Brand render script (Playwright, `--allow-file-access-from-files`) producing the wordmark PNG (transparent) and icons; favicon SVG hand-written (ink rounded square + tally dot).
- [ ] **Step 4:** Commit "Add design tokens and brand assets".

### Task 6: Media pipeline execution

**Files:** Create `scripts/media/images.ts`, `scripts/media/build.ts`, `scripts/media/run.ts` (spawn + friendly errors), `scripts/media/git.ts`, `src/lib/catalog.ts`; test `tests/unit/pipeline.int.test.ts` (runs the real pipeline on a temp `work/` with two generated 2-second clips, one rotated and silent).

**Interfaces (produced):** `src/generated/catalog.json` typed by:

```ts
export interface ImageSource { src: string; width: number }
export interface Rendition { id: 'hd' | 'sd'; src: string; width: number; height: number; bitrate: number; bytes: number }
export interface Work {
  slug: string; title: { ar: string; en: string | null }; description: { ar: string | null; en: string | null };
  type: WorkType; client: string | null; role: { ar: string | null; en: string | null }; order: number; addedAt: string;
  width: number; height: number; duration: number; fps: number; hasAudio: boolean;
  renditions: Rendition[];
  cover: { width: number; height: number; color: string; lqip: string; avif: ImageSource[]; webp: ImageSource[]; jpg: ImageSource };
  og: { src: string; width: 1200; height: 630; bytes: number };
}
export interface Portrait { width: number; height: number; avif: ImageSource[]; webp: ImageSource[]; png: ImageSource }
export interface Catalog { works: Work[]; portrait: Portrait }
export const catalog: Catalog; export function getWork(slug: string): Work | undefined;
```

Behaviour: cache in `.media-cache/video/<vkey>/{hd.mp4,sd.mp4,meta.json}`, `.media-cache/image/<ikey>/…`, `.media-cache/portrait/<pkey>/…`; rebuild `public/media/<slug>/` by hard-linking (copy fallback) with key-suffixed names; prune unused cache dirs; `--plan` prints and appends `needs-ffmpeg=true|false` to `$GITHUB_OUTPUT`; missing ffmpeg only errors when work is pending; cover beyond duration → clamp to 50% with a warning; ffprobe failure → `MediaError` naming the file with a re-export tip in both languages; `addedAt` = first git add date (UTC ISO) else file mtime; hidden entries skipped; OG composed (blurred fill + framed cover or full-bleed for ≥ 1.6 aspect, play badge, wordmark) and re-encoded at lower quality until < 300 KB.

- [ ] **Step 1: Failing integration test**: expects catalog with 2 works, both `hd` and `sd` for 1080p input, silent rotated clip reports `hasAudio: false` and portrait-oriented size, all referenced files exist, OG < 300 KB and 1200×630, a second run performs no encodes (spy on the runner count), `--plan` reports `needs-ffmpeg=false` after the first run, and a corrupt file yields an error naming it.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement. **Step 4:** Run → PASS.
- [ ] **Step 5:** Commit "Add media pipeline".

### Task 7: Seed content

**Files:** `work/{muscle-up-basics.mp4,running-film.mp4,v7-sampling-night.mp4,nimun-recap.mov,skin-and-pain.mp4,blood-sugar-test.mp4}` (copies), matching `.yml` files, `work/_template.yml`, `site/portrait.png`.

- [ ] **Step 1:** Copy sources (never modify originals); trim the portrait and save at 1200 px wide.
- [ ] **Step 2:** Pick cover seconds from extracted candidate frames.
- [ ] **Step 3:** Write the six `.yml` files with the approved AR/EN copy (spec §2), orders 1–6, `type`, `client` for NIMUN and V7, no `role`.
- [ ] **Step 4:** `npm run media` on the real content; inspect covers/OG images visually; commit "Add seed work and portrait".

### Task 8: Layout, home page and work pages

**Files:** `src/layouts/Base.astro`, `src/components/{Header,Footer,LangSwitch,Hero,WorkFeed,WorkCard,Player,About,Contact,Fab,MoreWork}.astro`, `src/pages/[...lang]/index.astro`, `src/pages/[...lang]/work/[slug].astro`, `src/pages/404.astro`, `src/pages/robots.txt.ts`, `src/pages/mahmoud-khaled.vcf.ts`, `src/pages/manifest.webmanifest.ts`; `public/og-home.jpg` (brand render).

Contracts: `Base` props `{ lang: Lang; title: string; description: string; path: string; altPath: string; og: { image: string; width: number; height: number; alt: string; type: 'website' | 'video.other'; video?: { url: string; width: number; height: number } }; jsonLd: unknown[]; preload?: { imagesrcset: string; imagesizes: string; type: string } }`. `Player` props `{ work: Work; lang: Lang; eager?: boolean; sizes: string }` and renders `data-player`, `data-renditions` (JSON of `{id,src,width,height,bitrate}` with based URLs), `data-title`, `data-duration`, `data-cta` (WhatsApp URL), a `<picture>` cover with `view-transition-name: cover-<slug>`, a `<button class="player__play">` named "تشغيل: <title> (0:30)" / "Play: …", a hidden end card, a hidden error box, and a `<noscript>` video. Every page sets `lang`/`dir`, canonical, alternates, OG/Twitter, JSON-LD via `jsonLdScript`.

- [ ] **Step 1:** Build pages and components (frontend-design pass); `npm run build` → no errors; `npx astro check` → 0 errors.
- [ ] **Step 2:** Commit "Add pages, layout and components".

### Task 9: Player behaviour and small scripts

**Files:** `src/lib/player-logic.ts`, `src/scripts/player.ts`, `src/scripts/hero.ts`, `src/scripts/share.ts`, `src/scripts/fab.ts`; tests `tests/unit/player-logic.test.ts`.

**Interfaces:** `chooseRendition(renditions: Array<{ id: 'hd' | 'sd'; width: number; bitrate: number }>, ctx: { cssWidth: number; dpr: number; net?: { saveData?: boolean; effectiveType?: string; downlink?: number } }): 'hd' | 'sd'`; `class StallGuard { constructor(opts?: { maxStallMs: number; maxWaits: number; windowMs: number }); waiting(now: number): void; playing(): void; shouldDowngrade(now: number): boolean }`.

Rules: single rendition → it; `saveData`, `slow-2g|2g|3g`, or `downlink*1e6*0.7 < hd.bitrate` → `sd`; else `cssWidth*clamp(dpr,1,3) <= sd.width*1.15` → `sd`; else `hd`. Guard counts only after the first `playing`.

- [ ] **Step 1: Failing tests** (saveData, 3g, downlink 2 vs hd 4.5 Mb/s, phone 390@3 → hd, card 300@2 → sd, only-hd, stall 2.6 s → true, 2 s → false, three waits in 20 s → true, spread waits → false, playing clears stall).
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement logic + DOM glue (create video in the click task, cover until `playing`, one-at-a-time, stall/err fallback preserving time, end card, Media Session, focus to video). **Step 4:** Run → PASS.
- [ ] **Step 5:** Commit "Add player, share, hero timecode and floating contact".

### Task 10: Local Pages-like server and e2e suite

**Files:** `scripts/serve.ts`, `tests/unit/serve.test.ts`, `playwright.config.ts`, `tests/e2e/{home,work,player,i18n,a11y,misc}.spec.ts`.

Server: base redirect, directory index, 301 to trailing slash, `.html` fallback, 404 page with status 404, single Range → 206 / 416, `Accept-Ranges`, MIME map (mp4, avif, webp, woff2, vcf, webmanifest, xml, svg, json, txt), gzip for text without Range, `Cache-Control: max-age=600`, ETag/304, HEAD, traversal blocked. Query strings ignored for file lookup.

E2E (projects `desktop-chromium` = Desktop Chrome + `channel: 'chrome'`, `mobile-webkit` = iPhone): home in both languages (lang/dir, h1, six cards, WhatsApp href), no failed requests/console errors, no overflow at 320 and 390, work pages (OG absolute + fetchable + < 300 KB, canonical without query, hreflang, CTA text), player (plays and advances; hd aborted → sd; keyboard Enter; end card), language switch keeps the slug, 404 status and content, no-slash and `?utm_source=ig` URLs, robots/sitemap/vcf, reduced motion keeps timecode still, axe (no serious/critical), and a first-load weight budget on the home page (all non-video transfer ≤ 400 KB, JS ≤ 12 KB).

- [ ] **Step 1:** Server tests → FAIL → implement → PASS.
- [ ] **Step 2:** e2e specs; `npm run build:e2e && npm run test:e2e` → all pass on both projects.
- [ ] **Step 3:** Commit "Add Pages-like server and end-to-end tests".

### Task 11: GitHub Actions

**Files:** `.github/workflows/deploy.yml`, `.github/workflows/test.yml`.

- [ ] **Step 1:** Load `dev-tools:verify-github-actions-locally`; write workflows per spec §9 (pinned major versions verified via `gh api`), cache `.media-cache` keyed on `hashFiles('work/**','site/**','scripts/media/**')`, conditional ffmpeg install from `--plan`, `SITE_URL`/`BASE_PATH` from `configure-pages` outputs.
- [ ] **Step 2:** `actionlint` clean; simulate the build step locally with `SITE_URL=https://example.github.io BASE_PATH=/some-repo` and check the output URLs.
- [ ] **Step 3:** Commit "Add deploy and test workflows".

### Task 12: Documentation

**Files:** `README.md` (developer), `ADD-A-VIDEO.md` (Mahmoud: Arabic first, then English), `work/_template.yml` comments.

- [ ] **Step 1:** Write both docs: publishing setup (Settings → Pages → Source: GitHub Actions), adding/replacing/hiding/reordering a video via github.com upload (≤ 25 MB) or GitHub Desktop (≤ 100 MB), recommended export settings, where the link appears, troubleshooting table mapping each build error to its fix.
- [ ] **Step 2:** Walk through the guide literally on a copy (add a new clip + yml, run `npm run media`, check the page) and fix anything the guide got wrong.
- [ ] **Step 3:** Commit "Add documentation".

### Task 13: Verification and polish

- [ ] **Step 1:** Lighthouse (mobile + desktop) on the production build for `/`, `/en/`, one work page; fix regressions; record scores.
- [ ] **Step 2:** Manual pass in the owner's Chrome at 390×844 and 1440×900 (Dark Reader locked out and verified), screenshots saved to `docs/screenshots/`.
- [ ] **Step 3:** iOS Simulator Mobile Safari: open, play a square and the 4:5 piece, confirm inline playback with sound controls, screenshots.
- [ ] **Step 4:** Whole-branch code review by a fresh reviewer; fix findings; commit.
- [ ] **Step 5:** Final build with `SITE_URL=http://<LAN-IP>:4747`, serve on `0.0.0.0:4747`, report local and LAN URLs.
