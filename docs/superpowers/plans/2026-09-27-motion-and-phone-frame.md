# Motion and the Phone Frame Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The site moves the way Mahmoud's reels do (text builds word by word, key words gold, «متحركة» stretches with kashida), vertical reels stand in a pixel-measured cherry iPhone on laptops and tablets, and every piece follows one rule: the picture plays where it is, the title opens its page, and the frame glides between the two.

**Architecture:** Words are split at build time (`src/lib/words.ts`) and rendered as spans by `Words.astro`, with a visually hidden whole copy for screen readers. CSS (`src/styles/motion.css`) times the hero line and the video title from page load; a small module (`src/scripts/motion.ts`) starts the other builds with `IntersectionObserver` and draws the kashida overlay. The phone is CSS only, inside `Player.astro`, sized from container units; its geometry lives in `src/lib/phone.ts`, which `src/lib/rows.ts` also uses so rows count a framed reel at the phone's outline. A render-blocking inline script in `<head>` gates motion and names exactly one frame per page change (`pageswap`/`pagereveal`) for a cross-document view transition.

**Tech Stack:** Astro 7 (static), TypeScript 6, plain CSS (container query units, `corner-shape`, view transitions), Vitest 5, Playwright 1.63 (desktop Chromium + iPhone WebKit) with axe, Lighthouse 13.

**Spec:** `docs/superpowers/specs/2026-09-27-motion-and-phone-frame-design.md` (read it first; this plan argues from it). Task 0 records the refinements below in the spec.

## Global Constraints

- Arabic first at `/` (`lang="ar" dir="rtl"`), English at `/en/`; every visible string comes from `src/lib/i18n.ts`.
- Palette unchanged; caption gold `--caption: #e8b100`; `--ease-cut: cubic-bezier(0.2, 0.8, 0.2, 1)`.
- The pop: 180 ms; the word appears at once (opacity 0 → 1 within the first 1%) at 80% scale and 0.22 em lower, then settles on `cubic-bezier(0.34, 1.56, 0.64, 1)`; durations and curves are tokens in `src/styles/tokens.css`.
- Hero line from 1.15 s, 270 ms apart, +240 ms after a comma, the word after «متحركة» waits 600 ms; headings 210 ms apart; feed titles 150 ms; services 170 ms; video title from 0.65 s, 190 ms apart; "See the work" cue from 3.9 s.
- Phone (shares of the phone's width): outline 0.4796; rim 0–1.57 (edge #150c0d to 0.1, body #452a2e to 0.74, highlight #93707a to 1.32, falloff #231012 to 1.57); groove #060304 to 1.65; glass #484a49 to 1.82, fading by 2.75; bezel to 3.64; corners 22.8% `corner-shape: superellipse(1.38)` or round 18.2%; screen corners 19.16 or 14.56; island 21.57 × 8.35 at 6.94 from the top, lens ⌀2.5 inside a ⌀4.5 ring at its right end; right button 31.1–42.9% of the height; left action 20.6–25.2%, volume 28.6–36.0% and 38.0–45.5%; buttons stand out 0.58 (right) and 0.5 (left); antenna break #2b171a at 10.3–11.3% of the height in the right rim.
- Framed: pieces with width/height < 0.6, on screens ≥ 760 px wide. Fill at rest, whole while watching, 560 ms on `--ease-cut`.
- Glide 620 ms on `--ease-cut`. Reduced motion: no builds, no glide, no easing; every tap does the same thing.
- Home page JavaScript under 12,000 bytes (e2e); Lighthouse ≥ 95 in all four categories (home and a video page, mobile); axe: no serious or critical issues; layout shift 0 during builds.
- Local commits on branch `motion-and-phone-frame`; no push; commit messages never mention an assistant and carry no attribution lines. Never discard local changes (`git restore`, `git checkout --`, `git reset`).
- e2e runs against the production build: `npm run build:e2e` before `npx playwright test`. It adds `tests/fixtures/work/` (a 9:16 edge-case text piece, 2.39:1, 1:1, 9:16 stored square, 9:19.5).

## Refinements to the spec (decided while planning)

1. **Screen readers read a whole copy.** Each built line is `<span class="visually-hidden words__read">whole text</span><span class="words" aria-hidden="true">…word spans…</span>` (single words need no copy). Some screen readers (VoiceOver on iOS) read inline-block spans as separate items; the copy keeps every line whole for them. Links keep their name, hidden words keep `opacity: 0`, and a title reached by keyboard builds at once.
2. **Mixed-direction titles keep their order.** Each word is an inline block, and inline blocks follow the line's direction, so a run in the other script ("Nike Air Max 2024" in an Arabic title) stays one unit.
3. **One glide name, set per page change.** Static `frame-<slug>` names on every feed piece and thumbnail would make neighbouring frames fly in from off-screen. Instead the `<head>` script adds `.is-gliding` (→ `view-transition-name: frame`) to the one frame being opened or returned to, on `pageswap` in the old page and `pagereveal` in the new. Coming back to the feed, a render-blocking `<link rel="expect">` waits for that piece. Verified in Chromium and WebKit before planning.
4. **Rows of phones are taller than rows of bare reels**, so the counts keep their shape but the breakpoints move (checked for the six tested sizes by simulation): two a row below 860 px or on screens taller than wide; three from 860 px on screens up to about 1.56:1; four from 1150 px on wider screens (1280×720, 1440×900, 1366×657 laptop windows) and from 1472 px when the window is under 933 px tall. A row with a 4:5 post in it may take one piece fewer, so every phone keeps room for its play button.
5. **A phone is never narrower than 15.1 rem** (`--phone-min`), so its screen keeps the play button's 14 rem; on very short screens (844×390) it is then taller than the window, as plain frames already are. This holds in the feed and in a video page's column.
6. **A word appears at once, then settles.** The pop starts at 80% size, 0.22 em low, fully opaque from its first frame (opacity steps from 0 to 1 in the first 1% of the 180 ms), and overshoots into place, like the pops in his captions. There are no half-transparent frames, so contrast checks (axe, Lighthouse) never catch a word mid-fade.
7. **Builds start 15% into the screen** (an `IntersectionObserver` root margin), one rule for headings, titles and services; for a heading that is about when it is fully in view.
8. **Arriving at a `#fragment` jumps there.** The site's smooth scrolling is for links within a page; on arrival (`#reel-<slug>`, `#about`) the `<head>` script turns it off until the page has loaded, so the page opens at the piece and what is on screen shows at once.
9. **The glide only moves frames that are on screen.** A frame is named only if it is in the viewport at that moment, and the feed jumps to `#reel-<slug>` before it is revealed, so a frame never flies off screen (going home by the name in the header, say). The `<link rel="expect">` is added only when arriving at `#reel-<slug>`, and only same-site addresses count.

## Review Focus

1. **Titles pasted into .yml files** (HTML, quotes, emoji, unbroken hashtags and links, Arabic with English runs): must build, read whole, never inject markup, never widen a 320 px phone → unit tests in Task 1, e2e in Task 3 (plus the existing 320/390 px overflow test).
2. **The motion script never starting** (a failed or very late download): hidden text must not stay hidden → e2e in Task 3 that strips the script's `motion-ready` mark and waits out the real 4 s fallback.
3. **Keyboard focus reaching text that has not built** (a Tab that scrolls a title only to the bottom edge): it must show at once → `focusin` handler and e2e in Task 3.
4. **Short, landscape and in-between windows** (844×390, 1000×700, 1366×657): the phone never narrower than its play button, buttons inside its screen and clear of the island, rows full or height-capped → e2e in Task 5.
5. **Safari at tablet size**: the phone must draw, with the corners the browser supports (superellipse, or round without `corner-shape`), and a 9:19.5 screen → e2e in the WebKit project at 1024×768 in Task 5 (Playwright's WebKit supports `corner-shape`, so the round fallback is checked by eye in the iOS 18.6 Simulator in Task 9).

---

## File map

| File | Change | Responsibility |
|---|---|---|
| `src/lib/words.ts` | create | Split a line into word units (bidi-safe), key marks, kashida point, timing (`RHYTHM`) |
| `src/lib/phone.ts` | create | Phone geometry, `isFramed`, `pieceOf`, `screenScales` |
| `src/lib/rows.ts` | modify | Rows over `Piece`s; thresholds scaled to the phone; new layout widths |
| `src/lib/i18n.ts` | modify | `heroCaption` and `contactHeading` become `Caption`s with key/stretch words |
| `src/components/Words.astro` | create | Word spans + whole copy for screen readers + optional trailing slot |
| `src/styles/tokens.css` | modify | Motion tokens, `--phone-min` |
| `src/styles/motion.css` | create | `.w`, gold, build rules, pop keyframes, kashida overlay |
| `src/styles/global.css` | modify | Import motion.css; glide name and timing |
| `src/scripts/motion.ts` | create | In-view builds, focus builds, kashida stretch, `motion-ready` |
| `src/layouts/Base.astro` | modify | `<head>` script (motion gate + glide naming), motion module |
| `src/components/Hero.astro` | modify | Hero line built from words; cue from 3.9 s |
| `src/components/WorkFeed.astro`, `About.astro`, `Contact.astro`, `MoreWork.astro` | modify | Headings (and services) build in view; feed pieces; thumbnails carry `data-frame` |
| `src/components/Reel.astro` | modify | Title builds with its arrow; phone-aware widths and breakpoints; `#reel-<slug>` |
| `src/components/Player.astro` | modify | Phone frame, media box, fill/whole, `data-frame` |
| `src/scripts/player.ts` | modify | Video goes into the media box |
| `src/components/Icon.astro` | modify | `forward` icon; flip by `:dir(rtl)` |
| `src/pages/[...lang]/work/[slug].astro` | modify | Title builds; phone column; back link to `#reel-<slug>` |
| `tests/unit/words.test.ts`, `phone.test.ts` | create | Unit tests |
| `tests/unit/rows.test.ts` | modify | Pieces, phone ratio, new expectations |
| `tests/e2e/motion.spec.ts`, `rules.spec.ts` | create | Motion; play-here/open-there and the glide |
| `tests/e2e/frames.spec.ts` | modify | Phone-aware frame checks |
| `tests/e2e/home.spec.ts`, `work.spec.ts` | modify | Titles checked by accessible name |
| `docs/superpowers/specs/2026-09-27-motion-and-phone-frame-design.md` | modify | Refinements |
| `README.md`, `docs/screenshots/*` | modify | Docs and refreshed screenshots |

---

## Task 0: Record the refinements in the spec

**Files:**
- Modify: `docs/superpowers/specs/2026-09-27-motion-and-phone-frame-design.md`

- [ ] **Step 1: Edit the spec**

In §2 "Rules", replace the first bullet with:

```markdown
- The text is in the page from the start, whole, for search engines and screen readers. Words are
  split into spans at build time. Screen readers read each line from a visually hidden copy of it and
  the spans are hidden from them, since some screen readers (VoiceOver on iOS) read separate spans as
  separate items. Hidden words use `opacity: 0`, so links stay focusable, and a title reached by
  keyboard builds at once.
- Each word is its own inline block, and inline blocks follow the line's direction, so a run in the
  other script ("Nike Air Max 2024" in an Arabic title) stays together as one unit.
```

In §2, replace the paragraph that starts "**The pop**" with:

```markdown
**The pop**: 180 ms. A word appears at once at 80% of its size and 0.22 em lower, then settles into
place with a slight overshoot (`cubic-bezier(0.34, 1.56, 0.64, 1)`), like the pops in his captions.
It is fully opaque from its first frame, so there are no half-transparent frames for contrast checks
to catch. Durations and curves become tokens in `src/styles/tokens.css`.
```

In the §2 table, change the "Section headings" row's "When about 60% in view" to "When 15% into the screen from the bottom (for a heading, about when it is fully in view)", and add to §2 "Rules":

```markdown
- Arriving at a `#fragment` (`#reel-<slug>`, `#about`) jumps straight there: the site's smooth
  scrolling is for links within a page, so it is off until the page has loaded.
```

In §3 "Layout", replace the second and fourth bullets with:

```markdown
- Rows of phones are taller than rows of bare reels, so the breakpoints in `Reel.astro` move to keep
  every full row on one screen at the six tested sizes: two a row below 860 px or on screens taller
  than wide; three from 860 px on screens up to about 1.56:1; four from 1150 px on wider screens
  (1280×720, 1440×900 and 1366×657 laptop windows) and from 1472 px on windows under 933 px tall. A row
  holding a 4:5 post may take one piece fewer, so every phone keeps room for its play button.
- A phone is never narrower than 15.1 rem, so its screen keeps the play button's 14 rem; on very
  short screens it is then taller than the window, as plain frames already are.
```

In §4, replace rule 3 with:

```markdown
3. **The frame glides.** Only the frame of the piece being opened, or returned to, carries the
   transition name: the `<head>` script adds `.is-gliding` (`view-transition-name: frame`) to it on
   `pageswap` in the old page and on `pagereveal` in the new, so no other frame moves. That is the
   phone (framed reels on wider screens) or the player (everything else), or a "More work" thumbnail.
   It replaces today's static `cover-<slug>` names. It moves in 620 ms on `--ease-cut` while the rest
   cross-fades. A frame is named only while it is on screen, so none ever flies off screen. Arriving
   at `#reel-<slug>`, a render-blocking `<link rel="expect">` waits for that piece and the feed jumps
   to it before it is revealed.
```

In §6 "Rules" (end to end), replace "Each page has exactly one `frame-<slug>` name." with:

```markdown
  - One frame on each side of a page change carries the glide's name, and none at rest.
```

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/specs/2026-09-27-motion-and-phone-frame-design.md docs/superpowers/plans/2026-09-27-motion-and-phone-frame.md
git commit -m "Refine the motion and phone-frame design for screen readers, rows and the glide"
```

---

## Task 1: Words, key marks, kashida and timing

**Files:**
- Create: `src/lib/words.ts`
- Create: `tests/unit/words.test.ts`
- Modify: `src/lib/i18n.ts` (`heroCaption`, `contactHeading`)
- Modify: `src/components/Hero.astro:39`, `src/components/Contact.astro:22` (read `.text` until Tasks 2–3)

**Interfaces:**
- Produces: `type Dir = 'rtl' | 'ltr'`; `interface Caption { text: string; key?: string; stretch?: string }`; `interface Rhythm { start?: number; step: number; comma?: number; stretch?: number; most?: number }`; `interface Word { text: string; key: boolean; kashida?: number; delay: number }`; `RHYTHM: { hero, heading, title, page, services }`; `splitWords(text: string, dir: Dir): string[]`; `kashidaAt(word: string): number | null`; `captionWords(caption: Caption, dir: Dir, rhythm: Rhythm): Word[]`.
- Produces: `ui[lang].heroCaption: Caption`, `ui[lang].contactHeading: Caption`.

- [ ] **Step 0: Baseline**

Run: `npm test && npm run check`
Expected: all unit tests pass, `astro check` reports 0 errors. (If not, stop and report: the plan assumes a green start.)

- [ ] **Step 1: Write the failing test** — `tests/unit/words.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import { ui } from '../../src/lib/i18n.ts';
import { captionWords, kashidaAt, RHYTHM, splitWords } from '../../src/lib/words.ts';

describe('splitWords', () => {
  it('splits a line into its words, keeping punctuation with its word', () => {
    expect(splitWords('مونتاج ريلز، كتابة متحركة، تغطية فعاليات وبراندات', 'rtl')).toEqual(['مونتاج', 'ريلز،', 'كتابة', 'متحركة،', 'تغطية', 'فعاليات', 'وبراندات']);
    expect(splitWords('Reels, kinetic captions, events and brands', 'ltr')).toEqual(['Reels,', 'kinetic', 'captions,', 'events', 'and', 'brands']);
  });

  it('ignores extra spaces and line breaks', () => {
    expect(splitWords('  يلا \n نشتغل   سوا ', 'rtl')).toEqual(['يلا', 'نشتغل', 'سوا']);
  });

  it('keeps a run in the other direction together, so it reads in its own order', () => {
    expect(splitWords('قبل ما تجرّب الـ Muscle-up', 'rtl')).toEqual(['قبل', 'ما', 'تجرّب', 'الـ', 'Muscle-up']);
    expect(splitWords('ريل لـ Nike Air Max 2024 في القاهرة', 'rtl')).toEqual(['ريل', 'لـ', 'Nike Air Max 2024', 'في', 'القاهرة']);
    expect(splitWords('ليلة Nike - Air 🎬 مع الفريق', 'rtl')).toEqual(['ليلة', 'Nike - Air', '🎬', 'مع', 'الفريق']);
    expect(splitWords('A recap of مؤتمر الشباب ٢٠٢٦ in Cairo', 'ltr')).toEqual(['A', 'recap', 'of', 'مؤتمر الشباب ٢٠٢٦', 'in', 'Cairo']);
  });

  it('leaves numbers in the line’s own direction as words of their own', () => {
    expect(splitWords('فيديو ٣ دقايق', 'rtl')).toEqual(['فيديو', '٣', 'دقايق']);
  });

  it('keeps pasted markup, links and hashtags as plain words', () => {
    expect(splitWords('عنوان </script><b>مش عريض</b> & 🎬 #هاشتاج_طويل_جداً', 'rtl')).toEqual(['عنوان', '</script><b>مش', 'عريض</b>', '&', '🎬', '#هاشتاج_طويل_جداً']);
  });
});

describe('kashidaAt', () => {
  it('stretches «متحركة» between ح and ر, the joining point nearest its middle', () => {
    expect(kashidaAt('متحركة')).toBe(3);
    expect(kashidaAt('متحركة،')).toBe(3);
  });

  it('only follows a letter that joins the next one, and never splits a letter from its marks', () => {
    expect(kashidaAt('كلّمني')).toBe(3); // after ل and its shadda
    expect(kashidaAt('ورد')).toBeNull(); // و, ر and د never join the letter after them
    expect(kashidaAt('Reels')).toBeNull();
  });
});

describe('captionWords', () => {
  it('times the Arabic hero line: 270 ms apart, a beat after a comma, and a wait while «متحركة» stretches', () => {
    const words = captionWords(ui.ar.heroCaption, 'rtl', RHYTHM.hero);
    expect(words.map((w) => w.delay)).toEqual([1150, 1420, 1930, 2200, 2800, 3070, 3340]);
    expect(words.filter((w) => w.key).map((w) => w.text)).toEqual(['كتابة', 'متحركة،']);
    expect(words.filter((w) => w.kashida !== undefined)).toEqual([{ text: 'متحركة،', key: true, kashida: 3, delay: 2200 }]);
  });

  it('builds the English hero line with its key words gold and nothing stretched', () => {
    const words = captionWords(ui.en.heroCaption, 'ltr', RHYTHM.hero);
    expect(words.map((w) => w.delay)).toEqual([1150, 1660, 1930, 2440, 2710, 2980]);
    expect(words.filter((w) => w.key).map((w) => w.text)).toEqual(['kinetic', 'captions,']);
    expect(words.every((w) => w.kashida === undefined)).toBe(true);
  });

  it('marks «سوا» and "together" in the contact heading', () => {
    expect(captionWords(ui.ar.contactHeading, 'rtl', RHYTHM.heading).filter((w) => w.key).map((w) => w.text)).toEqual(['سوا']);
    expect(captionWords(ui.en.contactHeading, 'ltr', RHYTHM.heading).filter((w) => w.key).map((w) => w.text)).toEqual(['together']);
  });

  it('fails the build when a key word or the stretched word is not in the line, or cannot stretch', () => {
    expect(() => captionWords({ text: 'يلا نشتغل سوا', key: 'بكرة' }, 'rtl', RHYTHM.heading)).toThrow(/بكرة/);
    expect(() => captionWords({ text: 'ورد جميل', stretch: 'ورد' }, 'rtl', RHYTHM.hero)).toThrow(/kashida/);
  });

  it('starts in-view builds at 0 and a video page title once its frame has landed', () => {
    expect(captionWords({ text: 'شغل تاني' }, 'rtl', RHYTHM.heading).map((w) => w.delay)).toEqual([0, 210]);
    expect(captionWords({ text: 'قبل ما تجرّب' }, 'rtl', RHYTHM.page).map((w) => w.delay)).toEqual([650, 840, 1030]);
  });

  it('never lets a long title take longer than its limit, and keeps the words in order', () => {
    const text = Array.from({ length: 30 }, (_, i) => `word${i}`).join(' ');
    const delays = captionWords({ text }, 'ltr', RHYTHM.title).map((w) => w.delay);
    expect(delays.at(-1)! - delays[0]!).toBeLessThanOrEqual(1200);
    expect(delays).toEqual([...delays].sort((a, b) => a - b));
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx vitest run tests/unit/words.test.ts`
Expected: FAIL — `Failed to resolve import "../../src/lib/words.ts"`.

- [ ] **Step 3: Implement** — `src/lib/words.ts`

```ts
/**
 * Text that builds the way Mahmoud's reels build captions (spec §2): a line split into the words that
 * pop on one at a time, the key words marked gold, and on an Arabic line one word that stretches with
 * kashida (ـ). Runs at build time; Words.astro renders the words as spans with their delays.
 */

export type Dir = 'rtl' | 'ltr';

/** A line, with its gold words and, optionally, the one word that stretches. */
export interface Caption {
  text: string;
  /** The words shown in gold, as they appear in `text`; trailing punctuation may be left off. */
  key?: string;
  /** A word that stretches with kashida as it appears (Arabic). */
  stretch?: string;
}

export interface Rhythm {
  /** When the first word appears, in ms. */
  start?: number;
  /** From one word to the next, in ms. */
  step: number;
  /** An extra beat after a comma, in ms. */
  comma?: number;
  /** After the stretched word, the next one waits at least this long, in ms, while the stretch plays. */
  stretch?: number;
  /** However long the line, its last word appears at most this long after the first, in ms. */
  most?: number;
}

export interface Word {
  text: string;
  /** Shown in gold. */
  key: boolean;
  /** Where the kashida goes in `text`, for the word that stretches. */
  kashida?: number;
  /** When it appears, in ms. */
  delay: number;
}

/** How each moment builds (spec §2). */
export const RHYTHM = {
  hero: { start: 1150, step: 270, comma: 240, stretch: 600 },
  heading: { step: 210, most: 1000 },
  title: { step: 150, most: 1200 },
  page: { start: 650, step: 190, most: 1500 },
  services: { step: 170 },
} satisfies Record<string, Rhythm>;

const LETTER = /\p{L}/u;
const RTL_LETTER = /[\p{Script=Arabic}\p{Script=Hebrew}]/u;
const NUMBER = /\p{N}/u;

/** The direction of a word's first letter, if it has one. */
function strongOf(word: string): Dir | null {
  for (const char of word) if (LETTER.test(char)) return RTL_LETTER.test(char) ? 'rtl' : 'ltr';
  return null;
}

/**
 * A line's words, in reading order. Each word becomes its own inline block on the page, and inline
 * blocks follow the line's direction only, so a run in the other direction ("Nike Air Max 2024" in an
 * Arabic title) stays together as one unit and keeps its own order.
 */
export function splitWords(text: string, dir: Dir): string[] {
  const words = text.split(/\s+/u).filter(Boolean);
  const other: Dir = dir === 'rtl' ? 'ltr' : 'rtl';
  // Numbers read with an other-direction word before them ("Max 2024").
  let last: Dir | null = null;
  const strong = words.map((word): Dir | null => {
    const found = strongOf(word);
    if (found) return (last = found);
    return NUMBER.test(word) && last === other ? other : null;
  });
  // Anything else between two other-direction words runs with them ("Nike - Air").
  const runs = strong.map((found, i): Dir => {
    if (found) return found;
    const before = strong.slice(0, i).reverse().find((d) => d !== null);
    const after = strong.slice(i + 1).find((d) => d !== null);
    return before === other && after === other ? other : dir;
  });
  const units: string[] = [];
  words.forEach((word, i) => {
    if (i > 0 && runs[i] === other && runs[i - 1] === other) units[units.length - 1] += ` ${word}`;
    else units.push(word);
  });
  return units;
}

/** A word without the punctuation after it. */
const bare = (word: string): string => word.replace(/[\p{P}\p{S}]+$/u, '');

/** Letters that join the letter after them, so a kashida may follow (Unicode joining type D). */
const JOINS_NEXT = /[ئبت-خس-ؿف-هىي]/u;
/** Letters that join the letter before them (joining types D and R). */
const JOINS_PREVIOUS = /[آ-ؿف-ي]/u;
/** Vowel marks, which stay with their letter. */
const MARK = /[ً-ٰٟ]/u;

/**
 * Where a kashida can stretch a word: after a letter that joins the next one (and after its marks),
 * before the letter it joins; of those, the point nearest the middle of the word. Null if none.
 */
export function kashidaAt(word: string): number | null {
  let best: { at: number; letters: number } | null = null;
  const points: Array<{ at: number; letters: number }> = [];
  let letters = 0;
  let joins = false;
  let at = 0;
  for (const char of word) {
    if (MARK.test(char)) {
      at += char.length;
      continue;
    }
    if (joins && JOINS_PREVIOUS.test(char)) points.push({ at, letters });
    joins = JOINS_NEXT.test(char);
    if (LETTER.test(char)) letters += 1;
    at += char.length;
  }
  const middle = letters / 2;
  for (const point of points) if (!best || Math.abs(point.letters - middle) < Math.abs(best.letters - middle)) best = point;
  return best?.at ?? null;
}

/** The positions of `phrase` among the line's words, compared without trailing punctuation. */
function find(words: string[], phrase: string, dir: Dir): number[] {
  const want = splitWords(phrase, dir).map(bare);
  for (let i = 0; i + want.length <= words.length; i++) {
    if (want.every((w, j) => bare(words[i + j]!) === w)) return want.map((_, j) => i + j);
  }
  throw new Error(`"${phrase}" is not in "${words.join(' ')}"`);
}

/** The line's words with their gold marks, kashida point and timing. */
export function captionWords(caption: Caption, dir: Dir, rhythm: Rhythm): Word[] {
  const texts = splitWords(caption.text, dir);
  const keys = new Set(caption.key ? find(texts, caption.key, dir) : []);
  const stretched = caption.stretch ? find(texts, caption.stretch, dir)[0] : undefined;
  const words = texts.map((text, i): Word => {
    const word: Word = { text, key: keys.has(i), delay: 0 };
    if (i === stretched) {
      const at = kashidaAt(text);
      if (at === null) throw new Error(`"${text}" has no letter a kashida can follow`);
      word.kashida = at;
    }
    return word;
  });
  // From one word to the next: a step, a beat more after a comma, a wait while a word stretches.
  const { start = 0, step, comma = 0, stretch = 0, most = Infinity } = rhythm;
  const gaps = words.slice(0, -1).map((word) => {
    const gap = step + (/[،,]$/u.test(word.text) ? comma : 0);
    return word.kashida === undefined ? gap : Math.max(gap, stretch);
  });
  const total = gaps.reduce((sum, gap) => sum + gap, 0);
  const scale = total > most ? most / total : 1;
  let time = start;
  words.forEach((word, i) => {
    word.delay = Math.round(time);
    time += (gaps[i] ?? 0) * scale;
  });
  return words;
}
```

- [ ] **Step 4: Make the captions data** — `src/lib/i18n.ts`

Add at the top: `import type { Caption } from './words.ts';`
In `interface Strings`, change `heroCaption: string[];` to `heroCaption: Caption;` and `contactHeading: string;` to `contactHeading: Caption;`.
In `ui.ar`:

```ts
    heroCaption: { text: 'مونتاج ريلز، كتابة متحركة، تغطية فعاليات وبراندات', key: 'كتابة متحركة', stretch: 'متحركة' },
    contactHeading: { text: 'يلا نشتغل سوا', key: 'سوا' },
```

In `ui.en`:

```ts
    heroCaption: { text: 'Reels, kinetic captions, events and brands', key: 'kinetic captions' },
    contactHeading: { text: "Let's work together", key: 'together' },
```

Keep the page building until Tasks 2 and 3: in `src/components/Hero.astro` change `{t.heroCaption.join(' ')}` to `{t.heroCaption.text}`; in `src/components/Contact.astro` change `{t.contactHeading}` to `{t.contactHeading.text}`.

- [ ] **Step 5: Run the tests and the type check**

Run: `npx vitest run tests/unit/words.test.ts && npm test && npm run check`
Expected: words tests PASS (all 13), the rest of the suite still passes, `astro check` 0 errors.

- [ ] **Step 6: Commit**

```bash
git add src/lib/words.ts tests/unit/words.test.ts src/lib/i18n.ts src/components/Hero.astro src/components/Contact.astro
git commit -m "Split captions into words with gold key words, a kashida point and timing"
```

---

## Task 2: Word spans and the hero line

**Files:**
- Modify: `src/styles/tokens.css` (motion tokens, `--phone-min`)
- Create: `src/styles/motion.css`
- Modify: `src/styles/global.css:1` (import)
- Create: `src/components/Words.astro`
- Modify: `src/layouts/Base.astro` (`<head>` script)
- Modify: `src/components/Hero.astro` (lead, cue delay)
- Create: `tests/e2e/motion.spec.ts`

**Interfaces:**
- Consumes: `captionWords`, `RHYTHM`, `Caption`, `Dir`, `Rhythm` (Task 1); `dirOf(lang)` from `src/lib/site.ts`.
- Produces: `<Words text={string | Caption} dir={Dir} rhythm={Rhythm}>` with optional `slot="trail"`; markup classes `.w`, `.w--key`, `.words`, `.words__read`, attribute `data-kashida`, style `--d`; `data-build="load" | "view"` contract; `html.motion`, `html.motion-ready`; tokens `--pop`, `--ease-pop`, `--fit`, `--glide`, `--phone-min`.

- [ ] **Step 1: Write the failing test** — `tests/e2e/motion.spec.ts`

```ts
import { expect, test, type Page } from '@playwright/test';
import { works } from './helpers.ts';

const GOLD = 'rgb(232, 177, 0)';

/** Waits until every animation inside `scope` has finished (a scope that has not built has none). */
const settled = (page: Page, scope: string) =>
  expect
    .poll(() => page.locator(scope).first().evaluate((el) => el.getAnimations({ subtree: true }).every((a) => a.playState === 'finished')), { timeout: 8_000 })
    .toBe(true);
const delaysOf = (page: Page, selector: string) => page.locator(selector).evaluateAll((els) => els.map((el) => parseFloat(getComputedStyle(el).animationDelay)));

test.describe('the hero line', () => {
  const lines = [
    { path: '', count: 7, keys: ['كتابة', 'متحركة،'], text: 'مونتاج ريلز، كتابة متحركة، تغطية فعاليات وبراندات' },
    { path: 'en/', count: 6, keys: ['kinetic', 'captions,'], text: 'Reels, kinetic captions, events and brands' },
  ];
  for (const { path, count, keys, text } of lines) {
    test(`builds word by word after the lower third, key words gold, and ends whole (${path || 'ar'})`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator('html')).toHaveClass(/\bmotion\b/);
      const words = page.locator('.hero__lead .w');
      await expect(words).toHaveCount(count);
      const delays = await delaysOf(page, '.hero__lead .w');
      expect(delays[0]).toBeCloseTo(1.15, 2);
      expect(delays).toEqual([...delays].sort((a, b) => a - b));
      expect(delays.at(-1)!).toBeLessThanOrEqual(3.35);
      await settled(page, '.hero__lead');
      expect(await words.evaluateAll((els) => els.map((el) => getComputedStyle(el).opacity))).toEqual(Array(count).fill('1'));
      await expect(page.locator('.hero__lead .w--key')).toHaveText(keys);
      expect(await page.locator('.hero__lead .w--key').evaluateAll((els) => els.map((el) => getComputedStyle(el).color))).toEqual(keys.map(() => GOLD));
      await expect(page.locator('.hero__lead .words')).toHaveAttribute('aria-hidden', 'true');
      await expect(page.locator('.hero__lead .words__read')).toHaveText(text);
    });
  }

  test('moves nothing on the page while it builds', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Layout shifts are measured by Chromium.');
    await page.goto('');
    const shift = await page.evaluate(
      () =>
        new Promise<number>((resolve) => {
          let total = 0;
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries() as Array<PerformanceEntry & { value: number; hadRecentInput: boolean }>) if (!entry.hadRecentInput) total += entry.value;
          }).observe({ type: 'layout-shift', buffered: true });
          setTimeout(() => resolve(total), 4_000);
        }),
    );
    expect(shift).toBe(0);
  });

  test('lets "See the work" cue only once the line has built', async ({ page }) => {
    await page.goto('');
    expect(await page.locator('.hero__next-cue svg').evaluate((el) => parseFloat(getComputedStyle(el).animationDelay))).toBeGreaterThanOrEqual(3.5);
  });
});

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('shows every word at once, unanimated', async ({ page }) => {
    for (const path of ['', `work/${works[0]!.slug}/`]) {
      await page.goto(path);
      await expect(page.locator('html')).not.toHaveClass(/\bmotion\b/);
      const states = await page.locator('.w, .pop').evaluateAll((els) => els.map((el) => `${getComputedStyle(el).opacity}/${el.getAnimations().length}`));
      expect(states.filter((state) => state !== '1/0'), path || 'home').toEqual([]);
    }
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('shows every word at once', async ({ page }) => {
    await page.goto('');
    await expect(page.locator('html')).not.toHaveClass(/\bmotion\b/);
    await expect(page.locator('.hero__lead .w').first()).toHaveCSS('opacity', '1');
    await expect(page.locator('.hero__lead .w').last()).toHaveCSS('opacity', '1');
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `npm run build:e2e && npx playwright test tests/e2e/motion.spec.ts`
Expected: FAIL — `html` has no class `motion`; `.hero__lead .w` count 0.

- [ ] **Step 3: Tokens** — append inside `:root` in `src/styles/tokens.css`, after `--ease-cut`:

```css

  /* Motion: a word pops on like a caption; a framed reel eases to its whole frame; a frame glides. */
  --pop: 180ms;
  --ease-pop: cubic-bezier(0.34, 1.56, 0.64, 1);
  --fit: 560ms;
  --glide: 620ms;
  /* The narrowest phone frame: its screen (92.72% of it) keeps the play button's 14rem. */
  --phone-min: 15.1rem;
```

- [ ] **Step 4: Motion styles** — create `src/styles/motion.css`

```css
/*
 * Text that builds the way Mahmoud's reels build captions (spec §2). Words.astro renders a line as word
 * spans (.w), with a whole copy for screen readers. html.motion (set in <head> when JavaScript runs and
 * the visitor allows motion) keeps words hidden until their moment:
 *   [data-build='load']  builds on page load, each word at its --d (the hero line, a video's title);
 *   [data-build='view']  builds once src/scripts/motion.ts adds .is-building as it comes into view, or
 *                        shows at once with .is-built when it is already on screen as the page starts.
 * Only opacity and transform change, so nothing else on the page moves.
 */
.w {
  display: inline-block;
}

.w--key {
  color: var(--caption);
}

/* The whole line for screen readers; the visible words are copied, not this. */
.words__read {
  -webkit-user-select: none;
  user-select: none;
}

/* On screen only: a printed page shows every word. */
@media screen and (prefers-reduced-motion: no-preference) {
  .motion [data-build='load'] .w,
  .motion [data-build='view'].is-building :is(.w, .pop) {
    animation: pop var(--pop) var(--ease-pop) var(--d, 0ms) both;
  }

  .motion [data-build='view']:not(.is-built) :is(.w, .pop) {
    opacity: 0;
  }
}

/* Like a caption pop: the word appears at once, a little low and at 80% of its size, and settles into
   place with a slight overshoot. It is never half transparent, so no frame of it reads as faint text. */
@keyframes pop {
  0% {
    opacity: 0;
    transform: translateY(0.22em) scale(0.8);
  }
  1% {
    opacity: 1;
  }
  100% {
    opacity: 1;
    transform: none;
  }
}
```

In `src/styles/global.css`, add after line 1 (`@import './tokens.css';`):

```css
@import './motion.css';
```

- [ ] **Step 5: The Words component** — create `src/components/Words.astro`

```astro
---
/**
 * A line as word spans that build like Mahmoud's captions (src/styles/motion.css). Screen readers read
 * the whole line from a visually hidden copy, and the spans are hidden from them: some read separate
 * spans as separate items. Place it inside the element that carries data-build. An optional "trail"
 * slot (a feed title's arrow) builds right after the last word.
 */
import { captionWords, type Caption, type Dir, type Rhythm } from '../lib/words.ts';

interface Props {
  text: string | Caption;
  dir: Dir;
  rhythm: Rhythm;
}

const { text, dir, rhythm } = Astro.props;
const caption = typeof text === 'string' ? { text } : text;
const words = captionWords(caption, dir, rhythm);
const trail = Astro.slots.has('trail');
const single = words.length === 1 && !trail ? words[0]! : null;
const trailDelay = (words.at(-1)?.delay ?? 0) + rhythm.step;
---

{
  single ? (
    <span class:list={['w', { 'w--key': single.key }]} style={`--d: ${single.delay}ms`}>
      {single.text}
    </span>
  ) : (
    <>
      <span class="visually-hidden words__read">{caption.text}</span>
      <span class="words" aria-hidden="true">
        {words.map((word, i) => (
          <>
            {i > 0 && ' '}
            <span class:list={['w', { 'w--key': word.key }]} data-kashida={word.kashida} style={`--d: ${word.delay}ms`}>
              {word.text}
            </span>
          </>
        ))}
        {trail && (
          <>
            {' '}
            <span class="w w--trail" style={`--d: ${trailDelay}ms`}>
              <slot name="trail" />
            </span>
          </>
        )}
      </span>
    </>
  )
}
```

Note: Astro's formatter may put `{single.text}` on its own line; that adds whitespace inside the inline-block, which HTML collapses at its edges. If a word renders with a visible leading or trailing gap, keep the text on one line with its tags.

- [ ] **Step 6: The motion gate** — in `src/layouts/Base.astro`, right after `<meta name="viewport" … />`:

```astro
    <script is:inline>
      // Text builds like Mahmoud's captions only where JavaScript runs and the visitor allows motion
      // (src/styles/motion.css). If the motion script has not started 4 s in (a failed download), the
      // text is shown plain.
      (() => {
        const root = document.documentElement;
        if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
        root.classList.add('motion');
        setTimeout(() => root.classList.contains('motion-ready') || root.classList.remove('motion'), 4000);
      })();
    </script>
```

- [ ] **Step 7: The hero line** — `src/components/Hero.astro`

Frontmatter: add `import { dirOf, href } from '../lib/site.ts';` (replacing the `href` import), `import { RHYTHM } from '../lib/words.ts';` and `import Words from './Words.astro';`.
Replace `<p class="hero__lead">{t.heroCaption.text}</p>` with:

```astro
    <p class="hero__lead" data-build="load"><Words text={t.heroCaption} dir={dirOf(lang)} rhythm={RHYTHM.hero} /></p>
```

In the `<style>`, change the cue so it waits for the line (comment and value):

```css
    /* Starts once the hero line has built (3.5 s), then three cues and rest. */
    .hero__next-cue :global(svg) {
      animation: cue-drop 2.4s 3.9s 3 both;
    }
```

- [ ] **Step 8: Run the tests**

Run: `npm run build:e2e && npx playwright test tests/e2e/motion.spec.ts tests/e2e/home.spec.ts tests/e2e/player.spec.ts`
Expected: PASS in both projects (`home.spec` still reads the cue delay as ≥ 1 s).

- [ ] **Step 9: Look at it**

Run a scratch Playwright script (Chrome channel) that opens `http://localhost:4748/mahmoud-khaled/` at 1440×900 and 390×844, takes viewport (not full-page) screenshots at 1.0 s, 2.3 s and 4.0 s, and view them. (Chromium's full-page capture misplaces transformed boxes; use viewport or element screenshots throughout.) Expected: the name and role wipe in, the line builds word by word with «كتابة متحركة» gold, nothing jumps, the words sit on the same baseline as plain text did.

- [ ] **Step 10: Commit**

```bash
git add src/styles/tokens.css src/styles/motion.css src/styles/global.css src/components/Words.astro src/layouts/Base.astro src/components/Hero.astro tests/e2e/motion.spec.ts
git commit -m "Build the hero line word by word like a caption, key words in gold"
```

---

## Task 3: Headings, titles, services and the video title build

**Files:**
- Create: `src/scripts/motion.ts`
- Modify: `src/layouts/Base.astro` (load the module)
- Modify: `src/components/WorkFeed.astro`, `About.astro`, `Contact.astro`, `MoreWork.astro` (headings, services)
- Modify: `src/components/Reel.astro` (title with arrow)
- Modify: `src/components/Icon.astro` (`forward`, `:dir(rtl)`)
- Modify: `src/pages/[...lang]/work/[slug].astro` (title)
- Modify: `tests/e2e/motion.spec.ts`, `tests/e2e/home.spec.ts`, `tests/e2e/work.spec.ts`, `tests/e2e/site.spec.ts`

**Interfaces:**
- Consumes: `Words`, `RHYTHM`, `dirOf`, `data-build` contract (Task 2).
- Produces: classes `.is-building`, `.is-built`, `html.motion-ready`; `.reel__go`; icon name `forward`.

- [ ] **Step 1: Write the failing tests**

Append to `tests/e2e/motion.spec.ts`:

```ts
test.describe('headings, titles and services', () => {
  test('build as they come into view', async ({ page }) => {
    await page.goto('');
    const heading = page.locator('#about-heading');
    await expect(heading).not.toHaveClass(/is-(built|building)/);
    await expect(heading.locator('.w').first()).toHaveCSS('opacity', '0');
    await heading.evaluate((el) => el.scrollIntoView({ block: 'center' }));
    await expect(heading).toHaveClass(/is-building/);
    await expect(heading.locator('.w').first()).toHaveCSS('opacity', '1');

    const services = page.locator('.about__list');
    await services.evaluate((el) => el.scrollIntoView({ block: 'center' }));
    await expect(services).toHaveClass(/is-building/);
    expect(await delaysOf(page, '.about__list li')).toEqual([0, 0.17, 0.34, 0.51]);
    await settled(page, '.about__list');
    const items = await services.locator('li').evaluateAll((els) => els.map((el) => [getComputedStyle(el).opacity, getComputedStyle(el, '::after').transform]));
    for (const [opacity, rule] of items) expect([opacity, rule === 'none' || rule === 'matrix(1, 0, 0, 1, 0, 0)']).toEqual(['1', true]);

    const contact = page.locator('#contact-heading');
    await contact.evaluate((el) => el.scrollIntoView({ block: 'center' }));
    await settled(page, '#contact-heading');
    await expect(contact.locator('.w--key')).toHaveText(['سوا']);
    await expect(contact).toHaveAccessibleName('يلا نشتغل سوا');
  });

  test('show at once what is already on screen as the page starts', async ({ page }) => {
    await page.goto('#about');
    await expect(page.locator('#about-heading')).toHaveClass(/is-built/);
    expect(await page.locator('#about-heading .w').first().evaluate((el) => el.getAnimations().length)).toBe(0);
  });

  test('build a feed title word by word, its arrow last', async ({ page }) => {
    const work = works[0]!;
    await page.goto('');
    const title = page.locator(`#title-${work.slug}`);
    await title.evaluate((el) => el.scrollIntoView({ block: 'center' }));
    await expect(title).toHaveClass(/is-building/);
    const delays = await delaysOf(page, `#title-${work.slug} .w`);
    expect(delays[0]).toBe(0);
    expect(delays).toEqual([...delays].sort((a, b) => a - b));
    await expect(title.locator('.w').last().locator('.reel__go')).toHaveCount(1);
    await settled(page, `#title-${work.slug}`);
    await expect(title).toHaveAccessibleName(work.title.ar);
  });

  test('show a title as soon as keyboard focus reaches it, wherever it is', async ({ page }) => {
    await page.goto('');
    const title = page.locator(`#title-${works.at(-1)!.slug}`);
    // Focus without scrolling, so only the focus can start the build (not coming into view).
    const before = await page.evaluate(() => scrollY);
    await title.locator('a').evaluate((el) => (el as HTMLElement).focus({ preventScroll: true }));
    expect(await page.evaluate(() => scrollY)).toBe(before);
    await expect(title).toHaveClass(/is-building/);
    await expect(title.locator('.w').first()).toHaveCSS('opacity', '1');
  });

  test('show everything plainly if the motion script never starts', async ({ page }) => {
    // It does start here, so take its mark away the moment it appears, as if it never had.
    await page.addInitScript(() => {
      new MutationObserver(() => {
        // Only when present: removing a missing class still rewrites the attribute and would loop.
        const root = document.documentElement;
        if (root?.classList.contains('motion-ready')) root.classList.remove('motion-ready');
      }).observe(document, { subtree: true, attributes: true, attributeFilter: ['class'] });
    });
    await page.goto('');
    await expect(page.locator('#about-heading .w').first()).toHaveCSS('opacity', '0');
    // The <head> script gives it 4 s, then shows the text plain.
    await expect(page.locator('html')).not.toHaveClass(/\bmotion\b/, { timeout: 6_000 });
    await expect(page.locator('#about-heading .w').first()).toHaveCSS('opacity', '1');
  });

  test('build a title pasted with markup, emoji, hashtags and links, and read it whole', async ({ page }) => {
    const edge = works.find((w) => w.slug === 'edge-case-text');
    expect(edge, 'the e2e build adds tests/fixtures/work/ (npm run build:e2e)').toBeDefined();
    for (const [path, text] of [['', edge!.title.ar], ['en/', edge!.title.en!]] as const) {
      await page.goto(path);
      const title = page.locator(`#title-${edge!.slug}`);
      await title.evaluate((el) => el.scrollIntoView({ block: 'center' }));
      await settled(page, `#title-${edge!.slug}`);
      await expect(title).toHaveAccessibleName(text);
      expect(new Set(await title.locator('.w').evaluateAll((els) => els.map((el) => getComputedStyle(el).opacity)))).toEqual(new Set(['1']));
      await expect(page.locator('main b, main img[src="x"]')).toHaveCount(0);
    }
  });
});

test.describe('a video page', () => {
  test('builds its title once the frame has landed, and is read whole', async ({ page }) => {
    const work = works[0]!;
    await page.goto(`work/${work.slug}/`);
    expect((await delaysOf(page, '#work-title .w'))[0]).toBeCloseTo(0.65, 2);
    await settled(page, '#work-title');
    await expect(page.locator('#work-title')).toHaveAccessibleName(work.title.ar);
  });
});
```

In `tests/e2e/home.spec.ts` (first test), replace
`for (const work of works) await expect(page.locator(`#title-${work.slug}`)).toHaveText(work.title.ar);`
with
`for (const work of works) await expect(page.locator(`#title-${work.slug}`)).toHaveAccessibleName(work.title.ar);`

In `tests/e2e/work.spec.ts`, replace `await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);` with `await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName(title);`, and in the edge-case test replace `await expect(page.locator(`#title-${edge!.slug}`)).toHaveText(edge!.title.ar);` with `await expect(page.locator(`#title-${edge!.slug}`)).toHaveAccessibleName(edge!.title.ar);`.

In `tests/e2e/site.spec.ts`, in the axe test, add before `const results = …`:

```ts
    // Check the page as it rests, not halfway through a build.
    await page.waitForFunction(() => [...document.querySelectorAll('.w, .pop')].every((el) => el.getAnimations().every((a) => a.playState !== 'running')));
```

- [ ] **Step 2: Run them to see them fail**

Run: `npm run build:e2e && npx playwright test tests/e2e/motion.spec.ts --project=desktop-chromium`
Expected: FAIL — `#about-heading` has no `.w`; no `.is-building`.

- [ ] **Step 3: The module** — create `src/scripts/motion.ts`

```ts
/**
 * Builds headings, feed titles and the services list ([data-build="view"]) as they come into view, the
 * way Mahmoud's reels build captions: .is-building, and src/styles/motion.css pops the words on in
 * turn. Whatever is already on screen as this starts shows at once (.is-built), so arriving back at a
 * piece shows it as it was; anything keyboard focus reaches first builds at once. Runs only where the
 * <head> script allowed motion (html.motion), and marks that it started (html.motion-ready).
 */
const root = document.documentElement;

function start(): void {
  root.classList.add('motion-ready');
  const seen = new WeakSet<Element>();
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!seen.has(entry.target)) {
          seen.add(entry.target);
          const { top, bottom } = entry.boundingClientRect;
          if (top < innerHeight && bottom > 0) build(entry.target, 'is-built');
        } else if (entry.isIntersecting) {
          build(entry.target, 'is-building');
        }
      }
    },
    // A build starts once the text is well into the screen, not at its first pixel.
    { rootMargin: '0px 0px -15% 0px' },
  );
  const build = (el: Element, state: 'is-built' | 'is-building'): void => {
    if (el.classList.contains('is-built') || el.classList.contains('is-building')) return;
    el.classList.add(state);
    observer.unobserve(el);
  };
  for (const el of document.querySelectorAll('[data-build="view"]')) observer.observe(el);
  addEventListener('focusin', (event) => {
    const el = (event.target as Element | null)?.closest?.('[data-build="view"]');
    if (el) build(el, 'is-building');
  });
}

if (root.classList.contains('motion')) start();
```

In `src/layouts/Base.astro`, just before `</body>`:

```astro
    <script>
      import '../scripts/motion.ts';
    </script>
```

and replace the `<head>` script with this one, which also makes arrival at a `#fragment` jump instead of scrolling smoothly from the top (the smooth scroll would start after the first frame, so what is on screen at arrival would build instead of showing, and in Task 7 the frame would glide to where the piece was before the scroll):

```astro
    <script is:inline>
      (() => {
        const root = document.documentElement;
        // Arriving at a #fragment (#reel-<slug>, #about) jumps there: the page's smooth scrolling is for
        // links within it, so it waits until the page has loaded.
        if (location.hash) {
          root.style.scrollBehavior = 'auto';
          addEventListener('load', () => requestAnimationFrame(() => root.style.removeProperty('scroll-behavior')), { once: true });
        }
        // Text builds like Mahmoud's captions only where JavaScript runs and the visitor allows motion
        // (src/styles/motion.css). If the motion script has not started 4 s in (a failed download), the
        // text is shown plain.
        if (!matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
          root.classList.add('motion');
          setTimeout(() => root.classList.contains('motion-ready') || root.classList.remove('motion'), 4000);
        }
      })();
    </script>
```

- [ ] **Step 4: Section headings**

`src/components/WorkFeed.astro`: import `{ dirOf } from '../lib/site.ts'`, `{ RHYTHM } from '../lib/words.ts'`, `Words from './Words.astro'`; replace `<h2 id="work-heading">{t.workHeading}</h2>` with

```astro
    <h2 id="work-heading" data-build="view"><Words text={t.workHeading} dir={dirOf(lang)} rhythm={RHYTHM.heading} /></h2>
```

`src/components/Contact.astro`: same imports; replace `<h2 id="contact-heading">{t.contactHeading.text}</h2>` with

```astro
  <h2 id="contact-heading" data-build="view"><Words text={t.contactHeading} dir={dirOf(lang)} rhythm={RHYTHM.heading} /></h2>
```

`src/components/MoreWork.astro`: import `dirOf` alongside `href, pageHref`, plus `RHYTHM` and `Words`; replace `<h2 id="more-heading">{t.moreWork}</h2>` with

```astro
  <h2 id="more-heading" data-build="view"><Words text={t.moreWork} dir={dirOf(lang)} rhythm={RHYTHM.heading} /></h2>
```

- [ ] **Step 5: About: heading and services** — `src/components/About.astro`

Imports: `import { dirOf } from '../lib/site.ts';`, `import { RHYTHM } from '../lib/words.ts';`, `import Words from './Words.astro';`.
Markup: replace the `h2` and the services `ul`:

```astro
  <h2 id="about-heading" data-build="view"><Words text={t.aboutHeading} dir={dirOf(lang)} rhythm={RHYTHM.heading} /></h2>
```

```astro
      <ul class="about__list" role="list" data-build="view">
        {t.services.map((service, i) => <li class="pop" style={`--d: ${i * RHYTHM.services.step}ms`}>{service}</li>)}
      </ul>
```

Style: replace the `.about__list li { … }` rule with:

```css
  /* Each service pops on from the reading start, and its rule draws in from there (motion.css). */
  .about__list li {
    position: relative;
    padding-bottom: 0.5rem;
    transform-origin: right center;
  }

  .about__list li::after {
    content: '';
    position: absolute;
    inset-inline: 0;
    bottom: 0;
    height: 1px;
    background: var(--rule);
    transform-origin: right center;
  }

  .about__list:dir(ltr) li,
  .about__list:dir(ltr) li::after {
    transform-origin: left center;
  }

  @media screen and (prefers-reduced-motion: no-preference) {
    :global(.motion) .about__list:not(.is-built) li::after {
      transform: scaleX(0);
    }

    :global(.motion) .about__list.is-building li::after {
      animation: rule-in 520ms var(--ease-cut) calc(var(--d) + 120ms) both;
    }
  }

  @keyframes rule-in {
    from {
      transform: scaleX(0);
    }
    to {
      transform: none;
    }
  }
```

- [ ] **Step 6: The forward arrow** — `src/components/Icon.astro`

Add to `ICONS` after `back`:

```ts
  forward: { flipRtl: true, body: "<path d=\"M5 12h14\" /><path d=\"m12 5 7 7-7 7\" />" },
```

Replace the flip rule (it must follow the element's own direction, so an English title on the Arabic page points right):

```css
  .icon--flip-rtl:dir(rtl) {
    transform: scaleX(-1);
  }
```

- [ ] **Step 7: Feed titles** — `src/components/Reel.astro`

Imports: `import { RHYTHM } from '../lib/words.ts';` and `import Words from './Words.astro';`.
Replace the `h3`:

```astro
    <h3 class="reel__title" id={`title-${work.slug}`} lang={title.lang} dir={title.dir} data-build="view">
      <a href={pageHref(lang, work.slug)}>
        <Words text={title.text} dir={title.dir} rhythm={RHYTHM.title}>
          <span class="reel__go" slot="trail"><Icon name="forward" size={18} /></span>
        </Words>
      </a>
    </h3>
```

Style: delete the `.reel__title a:hover { … }` rule (an underline cannot run across word blocks) and add after `.reel__title a { text-decoration: none; }`:

```css
  /* The title opens the piece's page and says so: an arrow in a circle, pointing the reading way, that
     steps forward on hover and keyboard focus. The link's name stays the title (Words.astro). */
  .reel__title :global(.w--trail) {
    vertical-align: middle;
  }

  .reel__go {
    display: inline-grid;
    place-items: center;
    width: 2.25rem;
    height: 2.25rem;
    border: 1.5px solid var(--rule-strong);
    border-radius: 50%;
    color: var(--white);
    transition:
      translate 220ms var(--ease-cut),
      border-color 160ms linear;
  }

  .reel__title a:is(:hover, :focus-visible) .reel__go {
    border-color: var(--white);
    translate: 5px 0;
  }

  .reel__title a:is(:hover, :focus-visible) .reel__go:dir(rtl) {
    translate: -5px 0;
  }
```

- [ ] **Step 8: The video title** — `src/pages/[...lang]/work/[slug].astro`

Imports: `import Words from '../../../components/Words.astro';` and `import { RHYTHM } from '../../../lib/words.ts';`.
Replace `<h1 id="work-title" lang={title.lang} dir={title.dir}>{title.text}</h1>` with:

```astro
        <h1 id="work-title" lang={title.lang} dir={title.dir} data-build="load"><Words text={title.text} dir={title.dir} rhythm={RHYTHM.page} /></h1>
```

- [ ] **Step 9: Run the tests**

Run: `npm run build:e2e && npx playwright test tests/e2e/motion.spec.ts tests/e2e/home.spec.ts tests/e2e/work.spec.ts tests/e2e/site.spec.ts`
Expected: PASS in both projects, including axe and the 320/390 px no-overflow checks.

- [ ] **Step 10: Look at it**

Scratch screenshots (Chrome, 1440×900 and 390×844): a feed title mid-build and built, the arrow circle on the title's last line and centred on it, its hover nudge (hover the link, screenshot), the services with their rules, the contact heading with «سوا» gold, a video page title building. Tune `.w--trail` alignment if the circle sits off the text's middle.

- [ ] **Step 11: Commit**

```bash
git add src/scripts/motion.ts src/layouts/Base.astro src/components/WorkFeed.astro src/components/About.astro src/components/Contact.astro src/components/MoreWork.astro src/components/Reel.astro src/components/Icon.astro 'src/pages/[...lang]/work/[slug].astro' tests/e2e/motion.spec.ts tests/e2e/home.spec.ts tests/e2e/work.spec.ts tests/e2e/site.spec.ts
git commit -m "Build headings, feed titles, services and video titles as they come into view"
```

---

## Task 4: The kashida stretch

**Files:**
- Modify: `src/scripts/motion.ts`
- Modify: `src/styles/motion.css`
- Modify: `src/components/Hero.astro` (`.hero__lead { position: relative }`)
- Modify: `tests/e2e/motion.spec.ts`

**Interfaces:**
- Consumes: `.w[data-kashida]` from Words.astro (Task 2).
- Produces: `.w__stretch` overlay and `.is-stretching` on the word while it runs.

- [ ] **Step 1: Write the failing test** — append inside `test.describe('the hero line', …)` in `tests/e2e/motion.spec.ts`:

```ts
  test('stretches «متحركة» with kashida and relaxes it, moving nothing', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Layout shifts are measured by Chromium.');
    await page.goto('');
    const shift = page.evaluate(
      () =>
        new Promise<number>((resolve) => {
          let total = 0;
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries() as Array<PerformanceEntry & { value: number; hadRecentInput: boolean }>) if (!entry.hadRecentInput) total += entry.value;
          }).observe({ type: 'layout-shift', buffered: true });
          setTimeout(() => resolve(total), 4_500);
        }),
    );
    await page.waitForFunction(() => document.querySelector('.hero__lead .w__stretch')?.textContent?.includes('ـ'), null, { timeout: 5_000 });
    await expect(page.locator('.hero__lead .w.is-stretching')).toHaveCount(1);
    await expect(page.locator('.hero__lead .w__stretch')).toHaveCount(0, { timeout: 3_000 });
    await expect(page.locator('.hero__lead .is-stretching')).toHaveCount(0);
    expect(await shift).toBe(0);
  });

  test('stretches nothing in English', async ({ page }) => {
    await page.goto('en/');
    await expect(page.locator('.hero__lead [data-kashida]')).toHaveCount(0);
  });
```

- [ ] **Step 2: Run it to see it fail**

Run: `npm run build:e2e && npx playwright test tests/e2e/motion.spec.ts -g kashida --project=desktop-chromium`
Expected: FAIL — timeout waiting for `.w__stretch`.

- [ ] **Step 3: Implement** — in `src/scripts/motion.ts`, add above `function start()`:

```ts
const TATWEEL = 'ـ';

/**
 * Stretches a word with kashida as it pops on, then relaxes it, like the key words in his captions.
 * A copy laid over the word (.w__stretch) draws the stretch into the room after it, still empty
 * because the next word waits for it; the word keeps its width, so nothing on the page moves.
 * Skipped when this starts after the word has appeared, or when the line has too little room left.
 */
function stretchWhenShown(word: HTMLElement): void {
  const text = word.textContent ?? '';
  const at = Number(word.dataset.kashida);
  word.addEventListener(
    'animationstart',
    () => {
      const box = word.offsetParent;
      if (!(box instanceof HTMLElement)) return;
      const copy = document.createElement('span');
      copy.className = 'w__stretch';
      const show = (n: number): void => {
        copy.textContent = text.slice(0, at) + TATWEEL.repeat(n) + text.slice(at);
      };
      show(6);
      word.append(copy);
      const perKashida = (copy.offsetWidth - word.offsetWidth) / 6;
      const room = getComputedStyle(word).direction === 'rtl' ? word.offsetLeft : box.clientWidth - word.offsetLeft - word.offsetWidth;
      const most = perKashida > 0 ? Math.min(6, Math.floor(room / perKashida)) : 0;
      if (most < 2) return void copy.remove();
      show(0);
      word.classList.add('is-stretching');
      // Out one kashida at a time as the pop lands, a beat, then back: about 600 ms in all.
      for (let n = 1; n <= most; n++) setTimeout(() => show(n), 110 + (n - 1) * 36);
      for (let n = most - 1; n >= 0; n--) setTimeout(() => show(n), 340 + (most - 1 - n) * 50);
      setTimeout(() => {
        copy.remove();
        word.classList.remove('is-stretching');
      }, 340 + most * 50);
    },
    { once: true },
  );
}
```

At the end of `start()`:

```ts
  const stretched = document.querySelector<HTMLElement>('.w[data-kashida]');
  if (stretched) stretchWhenShown(stretched);
```

Append to `src/styles/motion.css`:

```css
/* The stretched word (motion.ts): a copy over it draws the kashida into the empty room after it, so the
   word, and the line, keep their size. */
.w[data-kashida] {
  position: relative;
}

.w.is-stretching {
  -webkit-text-fill-color: transparent;
}

.w__stretch {
  position: absolute;
  inset-block-start: 0;
  inset-inline-start: 0;
  white-space: nowrap;
  pointer-events: none;
  -webkit-text-fill-color: currentColor;
}
```

In `src/components/Hero.astro`, add `position: relative;` to `.hero__lead` (the stretch measures the room left on its line against it).

- [ ] **Step 4: Run the tests**

Run: `npm run build:e2e && npx playwright test tests/e2e/motion.spec.ts`
Expected: PASS in both projects (the kashida test is Chromium only).

- [ ] **Step 5: Look at it**

Scratch: at 1440×900 and 390×844 capture frames every 40 ms from 2.2 s to 2.9 s after load (Arabic home) and view them. Expected: «متحركة» grows leftwards into the empty space, gold, holds, relaxes; the words before it never move; at 390 px, when the word ends its line, the stretch is shorter or skipped, never past the lead's edge.

- [ ] **Step 6: Commit**

```bash
git add src/scripts/motion.ts src/styles/motion.css src/components/Hero.astro tests/e2e/motion.spec.ts
git commit -m "Stretch «متحركة» with kashida as it appears, without moving the line"
```

---

## Task 5: The phone frame in the feed

**Files:**
- Create: `src/lib/phone.ts`, `tests/unit/phone.test.ts`
- Modify: `src/lib/rows.ts`, `tests/unit/rows.test.ts`
- Modify: `src/components/WorkFeed.astro` (pieces)
- Modify: `src/components/Reel.astro` (`--shape`, `--least`, breakpoints, `sizes`)
- Modify: `src/components/Player.astro` (phone, media box, fill/whole)
- Modify: `src/scripts/player.ts` (video into the media box)
- Modify: `tests/e2e/frames.spec.ts`

**Interfaces:**
- Produces (`src/lib/phone.ts`): `FRAMED_BELOW = 0.6`, `PHONE_SHAPE = 0.4796`, `BEZEL = 0.0364`, `SCREEN_SHARE`, `SCREEN_SHAPE`, `isFramed(ratio): boolean`, `interface Piece { shape: number; screen: number }`, `pieceOf(ratio): Piece`, `screenScales(ratio): { fill: number; whole: number }`.
- Produces (`src/lib/rows.ts`): `layRows(pieces: readonly Piece[], layout: RowLayout): RowPlace[]` (was `ratios: readonly number[]`); `FEED_ROWS` values change.
- Produces (markup): `.phone` wrapper around every player (`.phone--on` when framed), `.phone__keys`, `.phone__volume`, `.phone__island`, `.player__media`; `--fill`, `--whole` on framed players.

- [ ] **Step 1: Write the failing unit tests**

Create `tests/unit/phone.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { isFramed, PHONE_SHAPE, pieceOf, SCREEN_SHAPE, SCREEN_SHARE, screenScales } from '../../src/lib/phone.ts';

describe('the phone frame', () => {
  it('holds reels and taller pieces, not 4:5 posts or anything wider', () => {
    expect([9 / 16, 9 / 19.5, 0.59].map(isFramed)).toEqual([true, true, true]);
    expect([0.6, 4 / 5, 1, 16 / 9].map(isFramed)).toEqual([false, false, false, false]);
  });

  it('has a 9:19.5 screen inside the outline measured on the photo', () => {
    expect(PHONE_SHAPE).toBe(0.4796);
    expect(SCREEN_SHARE).toBeCloseTo(0.9272, 4);
    expect(SCREEN_SHAPE).toBeCloseTo(9 / 19.5, 2);
  });

  it('fills the screen at rest and shows the whole picture while it plays', () => {
    const reel = screenScales(9 / 16);
    expect(reel.fill).toBeCloseTo(1.2208, 3);
    expect(reel.whole).toBe(1);
    const recording = screenScales(9 / 19.5);
    expect(recording.fill).toBeCloseTo(1, 2);
    expect(recording.whole).toBe(1);
    const taller = screenScales(9 / 21);
    expect(taller.fill).toBe(1);
    expect(taller.whole).toBeCloseTo(0.93, 3);
  });

  it('counts a framed reel as the phone’s outline in the rows, its play button on the screen', () => {
    expect(pieceOf(9 / 16)).toEqual({ shape: PHONE_SHAPE, screen: SCREEN_SHARE });
    expect(pieceOf(4 / 5)).toEqual({ shape: 4 / 5, screen: 1 });
  });
});
```

Replace `tests/unit/rows.test.ts` with:

```ts
import { describe, expect, it } from 'vitest';
import { pieceOf, PHONE_SHAPE } from '../../src/lib/phone.ts';
import { FEED_ROWS, layRows, type RowLayout } from '../../src/lib/rows.ts';

const REEL = 9 / 16;
const FILM = 16 / 9;
const POST = 4 / 5;
const SQUARE = 1;
const SCOPE = 2.39;
const TALL = 9 / 19.5;
const CLASSIC = 4 / 3;

const lay = (ratios: number[], layout: RowLayout) => layRows(ratios.map(pieceOf), layout);
/** The pieces (by their place in Mahmoud's order) in each row, as the screen shows them. */
const rows = (ratios: number[], layout: RowLayout = FEED_ROWS.wide): number[][] => {
  const byOrder = lay(ratios, layout)
    .map((place, piece) => ({ ...place, piece }))
    .sort((a, b) => a.order - b.order);
  const out: number[][] = [];
  for (const { row, piece } of byOrder) (out[row] ??= []).push(piece);
  return out;
};

describe('layRows', () => {
  it('fills rows with two, three or four reels in their phones by the shape of the screen, in order', () => {
    const reels = Array.from({ length: 9 }, () => REEL);
    expect(rows(reels, FEED_ROWS.tall)).toEqual([[0, 1], [2, 3], [4, 5], [6, 7], [8]]);
    expect(rows(reels, FEED_ROWS.narrow)).toEqual([[0, 1, 2], [3, 4, 5], [6, 7, 8]]);
    expect(rows(reels)).toEqual([[0, 1, 2], [3, 4, 5], [6, 7, 8]]);
    expect(rows(reels, FEED_ROWS.short)).toEqual([[0, 1, 2, 3], [4, 5, 6, 7], [8]]);
  });

  it('gives a film a row of its own, and moves the next pieces up to finish the row before it', () => {
    // Mahmoud's seed order: reel, film, reel, 4:5 event, reel, reel.
    const seed = [REEL, FILM, REEL, POST, REEL, REEL];
    expect(rows(seed)).toEqual([[0, 2, 3], [1], [4, 5]]);
    expect(rows(seed, FEED_ROWS.tall)).toEqual([[0, 2], [1], [3, 4], [5]]);
  });

  it('on short, wide screens takes one piece fewer in a row with a post, so every phone keeps its play button', () => {
    expect(rows([REEL, FILM, REEL, POST, REEL, REEL], FEED_ROWS.short)).toEqual([[0, 2, 3], [1], [4, 5]]);
  });

  it('keeps his order exactly when the shapes allow it', () => {
    expect(rows([FILM, REEL, REEL, REEL, SCOPE, POST, POST])).toEqual([[0], [1, 2, 3], [4], [5, 6]]);
  });

  it('lets a moderately wide piece share its row with the pieces after it', () => {
    expect(rows([CLASSIC, REEL, REEL, REEL])).toEqual([[0, 1], [2, 3]]);
  });

  it('sizes a full row by its own pieces, and one that is not full like a row of reels', () => {
    const ratios = [REEL, FILM, REEL, POST, REEL, REEL, TALL, SQUARE, SCOPE, REEL];
    const shapes = ratios.map((r) => pieceOf(r).shape);
    for (const layout of Object.values(FEED_ROWS)) {
      const places = lay(ratios, layout);
      for (const row of rows(ratios, layout)) {
        const own = row.reduce((total, piece) => total + shapes[piece]!, 0);
        const { count, sum } = places[row[0]!]!;
        expect(row.every((piece) => places[piece]!.count === count && places[piece]!.sum === sum)).toBe(true);
        if (own >= layout.least) expect([count, sum]).toEqual([row.length, own]);
        else expect([count, sum >= own, sum <= layout.typical.sum]).toEqual([Math.max(row.length, layout.typical.count), true, true]);
      }
    }
  });

  it('keeps every row but the last full for work shaped like his', () => {
    const mixes = [
      [REEL, FILM, REEL, POST, REEL, REEL],
      [REEL, REEL, FILM, REEL, POST, POST, REEL, FILM, REEL, REEL, SQUARE, REEL],
      [FILM, FILM, REEL, REEL, REEL, REEL, POST, REEL],
    ];
    for (const ratios of mixes) {
      for (const layout of Object.values(FEED_ROWS)) {
        const places = lay(ratios, layout);
        for (const row of rows(ratios, layout).slice(0, -1)) expect(places[row[0]!]!.count, JSON.stringify(row)).toBe(row.length);
      }
    }
  });

  it('sizes a last row that is not full like a row of phones, instead of stretching it across', () => {
    expect(lay([REEL, REEL, REEL, REEL], FEED_ROWS.wide).at(-1)).toMatchObject({ count: 3, sum: 3 * PHONE_SHAPE });
    expect(lay([REEL, REEL, REEL], FEED_ROWS.tall).at(-1)).toMatchObject({ count: 2, sum: 2 * PHONE_SHAPE });
    expect(lay([REEL, REEL, REEL, REEL, REEL], FEED_ROWS.short).at(-1)).toMatchObject({ count: 4, sum: 4 * PHONE_SHAPE });
  });

  it('never makes a play button narrower than it needs, on the phone’s screen, and places every piece once', () => {
    const mixes = [
      [TALL, SCOPE, SQUARE, REEL, TALL, POST, FILM, TALL],
      [SQUARE, SQUARE, TALL, TALL, TALL, SCOPE, REEL],
      [POST, FILM, CLASSIC, REEL, TALL, SQUARE, POST, REEL, REEL],
    ];
    for (const ratios of mixes) {
      for (const layout of Object.values(FEED_ROWS)) {
        const places = lay(ratios, layout);
        expect(places.map((p) => p.order).sort((a, b) => a - b)).toEqual(ratios.map((_, i) => i));
        places.forEach((place, i) => {
          const { shape, screen } = pieceOf(ratios[i]!);
          const width = (shape * screen * (layout.width - (place.count - 1) * layout.gap)) / place.sum;
          expect(width, `piece ${i}`).toBeGreaterThanOrEqual(layout.minPiece - 0.5);
        });
      }
    }
  });
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `npx vitest run tests/unit/phone.test.ts tests/unit/rows.test.ts`
Expected: FAIL — cannot resolve `src/lib/phone.ts`.

- [ ] **Step 3: Phone geometry** — create `src/lib/phone.ts`

```ts
/**
 * The phone frame vertical reels stand in on wider screens (spec §3): the newest iPhone in cherry,
 * measured on Apple's photo (the phone 1210 × 2523 px). Player.astro draws it in CSS from the same
 * numbers, as shares of the phone's width; the rows lay a framed reel out at the phone's outline.
 */

/** Pieces narrower than this (width per unit of height) stand in the phone: 9:16 reels and taller. */
export const FRAMED_BELOW = 0.6;
/** The phone's outline, width per unit of height. */
export const PHONE_SHAPE = 0.4796;
/** The black bezel around the screen, as a share of the phone's width. */
export const BEZEL = 0.0364;
/** The screen's share of the phone's width. */
export const SCREEN_SHARE = 1 - 2 * BEZEL;
/** The screen's shape as drawn: 9:19.5 to within 0.2%. */
export const SCREEN_SHAPE = SCREEN_SHARE / (1 / PHONE_SHAPE - 2 * BEZEL);

export const isFramed = (ratio: number): boolean => ratio < FRAMED_BELOW;

/** How a piece stands in the feed's rows on wider screens. */
export interface Piece {
  /** Width per unit of height: the video's own shape, or the phone's outline for a framed reel. */
  shape: number;
  /** The share of that width the play button sits in: the phone's screen, or all of it. */
  screen: number;
}

export const pieceOf = (ratio: number): Piece => (isFramed(ratio) ? { shape: PHONE_SHAPE, screen: SCREEN_SHARE } : { shape: ratio, screen: 1 });

const round = (n: number): number => Math.round(n * 1e4) / 1e4;

/**
 * How much a framed piece's picture is scaled in the screen: at rest it fills the screen (a 9:16 reel
 * loses a little of each side), and while it plays it shows whole (a taller one gets bands).
 */
export function screenScales(ratio: number): { fill: number; whole: number } {
  const k = ratio / SCREEN_SHAPE;
  return { fill: round(Math.max(1, k)), whole: round(Math.min(1, k)) };
}
```

- [ ] **Step 4: Rows over pieces** — `src/lib/rows.ts`

Add to the header comment, before its closing `*/`:

```
 * On these screens a vertical reel stands in the phone frame (lib/phone.ts): it counts as the phone's
 * outline, and its play button needs room on the phone's screen, not on the outline.
```

Replace everything from `const REEL = 9 / 16;` to the end of `FEED_ROWS` with:

```ts
/**
 * The rows were first tuned for bare 9:16 reels; a reel in its phone is narrower for its height, so
 * every width per unit of height scales with it and rows keep their counts.
 */
const SCALE = PHONE_SHAPE / (9 / 16);

/**
 * The layouts Reel.astro picks between by the shape of the screen, so a row fits the screen's height
 * and still fills its width: two phones a row on tall screens (tablets), three on most, four on wide
 * ones (laptop windows). `width` and `gap` are the feed's at the narrowest screen each is used on, less
 * a scrollbar: 760 px (tall), 860 px (narrow), 1100 px (wide), 1150 px (short).
 */
export const FEED_ROWS = {
  tall: { fill: 1.1 * SCALE, least: 0.9 * SCALE, max: 2 * SCALE, width: 685, gap: 23, minPiece: 224, typical: { count: 2, sum: 2 * PHONE_SHAPE } },
  narrow: { fill: 1.65 * SCALE, least: 1.3 * SCALE, max: 2.6 * SCALE, width: 783, gap: 25, minPiece: 224, typical: { count: 3, sum: 3 * PHONE_SHAPE } },
  wide: { fill: 1.65 * SCALE, least: 1.3 * SCALE, max: 2.6 * SCALE, width: 1010, gap: 30, minPiece: 224, typical: { count: 3, sum: 3 * PHONE_SHAPE } },
  short: { fill: 2.2 * SCALE, least: 1.75 * SCALE, max: 3.4 * SCALE, width: 1060, gap: 31, minPiece: 224, typical: { count: 4, sum: 4 * PHONE_SHAPE } },
} satisfies Record<string, RowLayout>;
```

Add at the top of the file (after the header comment): `import { PHONE_SHAPE, type Piece } from './phone.ts';`
Update the `minPiece` doc in `RowLayout` to: `/** The row's width at the narrowest screen this layout is used on, the gap between pieces, and the narrowest a play button's frame (a phone's screen) may get, in px. */`
Replace `layRows` with:

```ts
export function layRows(pieces: readonly Piece[], layout: RowLayout): RowPlace[] {
  const shape = (piece: number): number => pieces[piece]!.shape;
  /** How wide a piece's play-button frame is per unit of the row's height. */
  const button = (piece: number): number => pieces[piece]!.shape * pieces[piece]!.screen;
  const places: RowPlace[] = new Array(pieces.length);
  const waiting = pieces.map((_, piece) => piece);
  const fits = (members: number[], sum: number): boolean => {
    if (sum > layout.max) return false;
    const height = (layout.width - (members.length - 1) * layout.gap) / sum;
    return members.every((piece) => button(piece) * height >= layout.minPiece);
  };

  // A full row is shared by its own pieces. One that isn't full is sized like a row of reels, as far
  // as that keeps its narrowest piece at least as wide as a play button.
  const size = (members: number[], sum: number): Pick<RowPlace, 'count' | 'sum'> => {
    if (sum >= layout.least) return { count: members.length, sum };
    const count = Math.max(members.length, layout.typical.count);
    const narrowest = Math.min(...members.map(button));
    const cap = (narrowest * (layout.width - (count - 1) * layout.gap)) / layout.minPiece;
    return { count, sum: Math.max(sum, Math.min(layout.typical.sum, cap)) };
  };

  let order = 0;
  for (let row = 0; waiting.length > 0; row++) {
    const members = [waiting.shift()!];
    let sum = shape(members[0]!);
    while (sum < layout.fill) {
      const next = waiting.findIndex((piece) => shape(piece) < WIDE && fits([...members, piece], sum + shape(piece)));
      if (next < 0) break;
      const [piece] = waiting.splice(next, 1);
      members.push(piece!);
      sum += shape(piece!);
    }
    members.sort((a, b) => a - b);
    for (const piece of members) places[piece] = { row, order: order++, ...size(members, sum) };
  }
  return places;
}
```

- [ ] **Step 5: Run the unit tests**

Run: `npx vitest run tests/unit/phone.test.ts tests/unit/rows.test.ts`
Expected: PASS (4 + 9 tests).

- [ ] **Step 6: The feed passes pieces** — `src/components/WorkFeed.astro`

Add `import { pieceOf } from '../lib/phone.ts';`; replace
`const ratios = works.map((work) => ratioOf(work.width, work.height));` and the `layouts` line with:

```ts
const pieces = works.map((work) => pieceOf(ratioOf(work.width, work.height)));
const layouts = Object.entries(FEED_ROWS).map(([name, layout]) => [name, layRows(pieces, layout)] as const);
```

- [ ] **Step 7: Rows sized by the outline** — `src/components/Reel.astro`

Frontmatter: add `import { pieceOf, SCREEN_SHARE, screenScales } from '../lib/phone.ts';` and replace the `share`/`sizes`/`places` block with:

```ts
const piece = pieceOf(ratio);
const framed = piece.screen < 1;
// Its largest share of a row is, near enough, its largest share of the screen; a framed reel's cover
// fills the phone's screen, a little wider than the phone itself.
const cover = framed ? SCREEN_SHARE * screenScales(ratio).fill : 1;
const share = Math.max(...Object.values(rows).map((place) => Math.ceil((piece.shape / place.sum) * cover * 100)));
const sizes = `(min-width: 760px) ${share}vw, 100vw`;
const places = Object.entries(rows).map(([name, { order, count, sum }]) => `--o-${name}: ${order}; --n-${name}: ${count}; --s-${name}: ${round(sum)}`);
const style = [`--r: ${ratio}`, `--shape: ${piece.shape}`, ...(framed ? ['--least: var(--phone-min)'] : []), ...places].join('; ');
```

and change the article's `style={[`--r: ${ratio}`, ...places].join('; ')}` to `style={style}`.

Style: in the `@media (min-width: 760px)` `.reel` rule, change the width to

```css
      width: max(var(--least, 0px), calc(((100% - (var(--n) - 1) * var(--gap)) / var(--s) - 1px) * var(--shape)));
```

and in the `@supports (height: 1svh)` block to

```css
        width: max(var(--least, 0px), calc(min((100% - (var(--n) - 1) * var(--gap)) / var(--s) - 1px, var(--frame-h)) * var(--shape)));
```

Replace the three layout media queries (and the comments above them) with:

```css
  /* The screen's shape picks the layout, so a row of phones fits its height: two a row on tall
     screens, three once it is wider than tall... */
  @media (min-width: 860px) and (min-aspect-ratio: 1/1) {
    .reel {
      --o: var(--o-narrow);
      --n: var(--n-narrow);
      --s: var(--s-narrow);
    }
  }

  @media (min-width: 1100px) and (min-aspect-ratio: 1/1) {
    .reel {
      --o: var(--o-wide);
      --n: var(--n-wide);
      --s: var(--s-wide);
    }
  }

  /* ...and four on wider screens (laptop windows: 1280×720, 1440×900, 1366×657), where three would be
     taller than the screen. The feed stops widening at 92rem, so from there only the height decides. */
  @media (min-width: 1150px) and (max-width: 1471px) and (min-aspect-ratio: 25/16), (min-width: 1472px) and (max-height: 932px) {
    .reel {
      --o: var(--o-short);
      --n: var(--n-short);
      --s: var(--s-short);
    }
  }
```

- [ ] **Step 8: The video goes into the media box** — `src/scripts/player.ts`

In `class Player`, add the field `private readonly media: HTMLElement;`, set it in the constructor after `this.root = root;`:

```ts
    // The picture's box: the frame itself, or the part of a phone's screen that eases to whole.
    this.media = root.querySelector<HTMLElement>('.player__media') ?? root;
```

and in `ensureVideo()` change `this.root.prepend(video);` to `this.media.prepend(video);`.

- [ ] **Step 9: The phone** — `src/components/Player.astro`

Frontmatter: add `import { isFramed, screenScales } from '../lib/phone.ts';` and after `const cta = …`:

```ts
const ratio = ratioOf(work.width, work.height);
// A vertical reel stands in the phone frame on wider screens (lib/phone.ts): its picture fills the
// phone's screen at rest and shows whole while it plays.
const framed = isFramed(ratio);
const { fill, whole } = screenScales(ratio);
const style = [`--r: ${ratio}`, `--tint: ${work.cover.color}`, `background-image: url("${work.cover.lqip}")`, ...(framed ? [`--fill: ${fill}`, `--whole: ${whole}`] : [])].join('; ');
```

Markup: wrap the player and add the phone's parts; put the cover in the media box:

```astro
<div class="player-stage">
  <div class:list={['phone', { 'phone--on': framed }]}>
    <div
      class="player"
      data-player
      data-title={title.text}
      data-duration={work.duration}
      data-renditions={JSON.stringify(renditions)}
      data-artwork={href(work.cover.jpg.src)}
      data-artist={t.name}
      data-ended={t.ended}
      style={style}
    >
      <div class="player__media">
        <picture class="player__cover" style={`view-transition-name: cover-${work.slug}`}>
          <!-- sources and img unchanged -->
        </picture>
      </div>
      <!-- .player__play, .player__time, .player__sound, .player__end, .player__error, .player__status, noscript: unchanged -->
    </div>
    {
      framed && (
        <>
          <span class="phone__keys" aria-hidden="true" />
          <span class="phone__volume" aria-hidden="true" />
          <span class="phone__island" aria-hidden="true" />
        </>
      )
    }
  </div>
</div>
```

Style: add after the `.player-stage` rule:

```css
  /* Every player sits in .phone; only a framed reel on a wider screen draws it (below). */
  .phone {
    display: contents;
  }

  .phone__keys,
  .phone__volume,
  .phone__island {
    display: none;
  }

  /* The picture and, once it plays, the video: the whole frame, or in a phone a box that is scaled. */
  .player__media {
    position: absolute;
    inset: 0;
    z-index: 1;
  }
```

Append before `[hidden] { … }`:

```css
  /*
   * The phone (spec §3): the newest iPhone in cherry, measured on Apple's photo; every size is a share
   * of the phone's width. The player becomes its 9:19.5 screen. The phone takes its width from
   * --frame-h like any frame, never so narrow that its screen can't hold the play button. --u is 1% of
   * that width for the phone's own box only: its parts inside use cqi, which the phone gives them.
   */
  @supports (width: 1cqw) and (height: 1svh) {
    @media (min-width: 760px) {
      .phone--on {
        --phone-w: clamp(min(100cqw, var(--phone-min)), var(--frame-h, 100svh) * 0.4796, 100cqw);
        --u: calc(var(--phone-w) / 100);
        /* Cherry, from the rim's outer edge in; the light falls from the right. */
        --edge: #150c0d;
        --metal: #452a2e;
        --shine: #93707a;
        --falloff: #231012;
        container: phone / inline-size;
        display: block;
        position: relative;
        flex: none;
        width: var(--phone-w);
        aspect-ratio: 0.4796;
        border-radius: calc(var(--u) * 18.2);
        background: #000;
        box-shadow:
          inset 0 0 0 calc(var(--u) * 0.1) var(--edge),
          inset 0 0 0 calc(var(--u) * 0.74) var(--metal),
          inset 0 0 0 calc(var(--u) * 1.32) var(--shine),
          inset 0 0 0 calc(var(--u) * 1.57) var(--falloff),
          inset 0 0 0 calc(var(--u) * 1.65) #060304,
          inset 0 0 0 calc(var(--u) * 1.82) #484a49,
          inset 0 0 calc(var(--u) * 0.9) calc(var(--u) * 1.82) #6a6a6a;
      }

      /* Light across the rim: darker on the left, brighter on the right. */
      .phone--on::before {
        content: '';
        position: absolute;
        inset: 0;
        z-index: 4;
        padding: 1.57cqi;
        border-radius: inherit;
        background: linear-gradient(90deg, rgb(0 0 0 / 0.38), rgb(0 0 0 / 0) 30%, rgb(255 255 255 / 0) 62%, rgb(255 255 255 / 0.24));
        -webkit-mask:
          linear-gradient(#000 0 0) content-box,
          linear-gradient(#000 0 0);
        -webkit-mask-composite: xor;
        mask:
          linear-gradient(#000 0 0) content-box exclude,
          linear-gradient(#000 0 0);
        pointer-events: none;
      }

      /* The antenna break in the right rim. */
      .phone--on::after {
        content: '';
        position: absolute;
        top: 10.3%;
        right: 0;
        z-index: 5;
        width: 1.57cqi;
        height: 1%;
        background: #2b171a;
        pointer-events: none;
      }

      .phone--on > .player {
        position: absolute;
        inset: 3.64cqi;
        width: auto;
        aspect-ratio: auto;
        border-radius: 14.56cqi;
      }

      /* At rest the picture fills the screen (a 9:16 reel loses a little of each side); playing with
         sound eases it to its whole frame, the blurred preview dimmed above and below. */
      .phone--on .player__media {
        inset: 50% 0 auto;
        aspect-ratio: var(--r);
        transform: translateY(-50%) scale(var(--fill));
        transition: transform var(--fit) var(--ease-cut);
      }

      .phone--on .player:global(.is-watching) .player__media {
        transform: translateY(-50%) scale(var(--whole));
      }

      .phone--on .player::before {
        content: '';
        position: absolute;
        inset: 0;
        background: rgb(0 0 0 / 0.5);
        opacity: 0;
        transition: opacity var(--fit) linear;
      }

      .phone--on .player:global(.is-watching)::before {
        opacity: 1;
      }

      /* Buttons and labels keep clear of the screen's rounded corners. */
      .phone--on .player__play {
        padding: 5.4cqi;
      }

      .phone--on .player__time,
      .phone--on .player__sound,
      .phone--on .player__error {
        bottom: 5.4cqi;
      }

      .phone--on .player__time {
        inset-inline-end: 5.4cqi;
      }

      .phone--on .player__sound {
        inset-inline-start: 5.4cqi;
      }

      .phone--on .player__error {
        inset-inline: 5.4cqi;
      }

      .phone--on .phone__keys,
      .phone--on .phone__volume {
        display: block;
        position: absolute;
        inset: 0;
        pointer-events: none;
      }

      /* The action and volume buttons stand out of the left side; the side button (below) the right. */
      .phone__keys::before,
      .phone__keys::after,
      .phone__volume::before,
      .phone__volume::after {
        content: '';
        position: absolute;
        right: 100%;
        width: 0.5cqi;
        border-radius: 0.6cqi 0 0 0.6cqi;
        background: linear-gradient(90deg, var(--falloff), var(--metal) 35%, var(--shine) 70%, var(--metal));
        transform: scaleX(-1);
      }

      .phone__keys::before {
        top: 31.1%;
        right: auto;
        left: 100%;
        width: 0.58cqi;
        height: 11.8%;
        border-radius: 0 0.6cqi 0.6cqi 0;
        transform: none;
      }

      .phone__keys::after {
        top: 20.6%;
        height: 4.6%;
      }

      .phone__volume::before {
        top: 28.6%;
        height: 7.4%;
      }

      .phone__volume::after {
        top: 38%;
        height: 7.5%;
      }

      .phone--on .phone__island {
        display: block;
        position: absolute;
        top: 6.94cqi;
        left: 50%;
        z-index: 3;
        width: 21.57cqi;
        height: 8.35cqi;
        margin-left: -10.785cqi;
        border-radius: 999px;
        background: #000;
        pointer-events: none;
      }

      /* The front camera: a lens in the island's right end, in a faint ring. */
      .phone__island::before,
      .phone__island::after {
        content: '';
        position: absolute;
        top: 50%;
        aspect-ratio: 1;
        border-radius: 50%;
        transform: translateY(-50%);
      }

      .phone__island::before {
        right: 1.92cqi;
        width: 4.5cqi;
        background: radial-gradient(circle, #111219 0%, #0c0c11 50%, rgb(0 0 0 / 0) 71%);
      }

      .phone__island::after {
        right: 2.92cqi;
        width: 2.5cqi;
        background: radial-gradient(circle at 50% 46%, #07070f 0 26%, #262a57 40%, #5a45a3 55%, #22234a 66%, #08080f 78%);
      }

      /* On a narrow screen the duration moves to the top (as in a plain frame, above), here below the
         island. These come after the phone's own bottom: 5.4cqi so that bottom: auto wins; with both
         set, the label would stretch into a bar. */
      @container frame (width < 14.75rem) {
        .phone--on .player__time {
          top: 16cqi;
          bottom: auto;
        }
      }

      @container frame (width < 16rem) {
        .phone--on .player__time:lang(en) {
          top: 16cqi;
          bottom: auto;
        }
      }
    }
  }

  /* The photo's corners are a superellipse (exponent 2.6); browsers without corner-shape keep round ones. */
  @supports (corner-shape: superellipse(1.38)) and (width: 1cqw) and (height: 1svh) {
    @media (min-width: 760px) {
      .phone--on {
        border-radius: calc(var(--u) * 22.8);
        corner-shape: superellipse(1.38);
      }

      .phone--on::before {
        corner-shape: superellipse(1.38);
      }

      .phone--on > .player {
        border-radius: 19.16cqi;
        corner-shape: superellipse(1.38);
      }
    }
  }
```

- [ ] **Step 10: Phone-aware frame tests** — `tests/e2e/frames.spec.ts`

Replace the imports, constants and helpers at the top with:

```ts
import { expect, test, type Locator, type Page } from '@playwright/test';
import { isFramed, PHONE_SHAPE, SCREEN_SHAPE, SCREEN_SHARE } from '../../src/lib/phone.ts';
import { works } from './helpers.ts';

type Box = { x: number; y: number; width: number; height: number };

/** The narrowest a frame's screen gets: room for the play button, in English. */
const MIN_FRAME_WIDTH = 14 * 16;
/** The narrowest phone: its screen keeps that room. */
const MIN_PHONE_WIDTH = MIN_FRAME_WIDTH / SCREEN_SHARE;

const shape = (w: { width: number; height: number }) => w.width / w.height;
const pieceIn = (page: Page, slug: string) => page.locator('[data-reel]').filter({ has: page.locator(`#title-${slug}`) });
const frameIn = (page: Page, slug: string) => pieceIn(page, slug).locator('[data-player]');
const box = async (locator: Locator): Promise<Box> => (await locator.boundingBox())!;
/**
 * The phone a reel stands in, where one is drawn (wider screens), or null. Below 760 px the phone is
 * `display: contents`: Chromium gives it no box, but WebKit reports its child's, so ask its display.
 */
const phoneOf = async (scope: Locator): Promise<Box | null> => {
  const phone = scope.locator('.phone--on');
  if ((await phone.count()) === 0) return null;
  return (await phone.evaluate((el) => getComputedStyle(el).display === 'contents')) ? null : box(phone);
};
/** What stands in the layout: the phone, or the frame itself. */
const outline = async (scope: Locator): Promise<Box> => (await phoneOf(scope)) ?? box(scope.locator('[data-player]'));
const inside = (inner: Box, outer: Box) =>
  inner.x >= outer.x - 0.5 && inner.y >= outer.y - 0.5 && inner.x + inner.width <= outer.x + outer.width + 0.5 && inner.y + inner.height <= outer.y + outer.height + 0.5;
const overlap = (a: Box, b: Box) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
```

Keep `mediaShapes` as it is. Replace the first two tests with:

```ts
  test('show every video at its true shape, a vertical one filling a 9:19.5 phone screen on wider screens', async ({ page }) => {
    const squeezed = works.find((w) => w.slug === 'squeezed-reel');
    expect(squeezed, 'the e2e build adds tests/fixtures/work/ (npm run build:e2e)').toBeDefined();
    expect(shape(squeezed!)).toBeCloseTo(9 / 16, 3);

    await page.goto('');
    const wide = page.viewportSize()!.width >= 760;
    for (const work of works) {
      const piece = pieceIn(page, work.slug);
      const framed = wide && isFramed(shape(work));
      const screen = await box(piece.locator('[data-player]'));
      expect(screen.width / screen.height, `${work.slug} frame`).toBeCloseTo(framed ? SCREEN_SHAPE : shape(work), 2);
      const picture = await box(piece.locator('.player__media'));
      expect(picture.width / picture.height, `${work.slug} picture`).toBeCloseTo(shape(work), 2);
      if (framed) expect(picture.height, `${work.slug} fills its screen`).toBeGreaterThanOrEqual(screen.height - 1);
      const media = await mediaShapes(piece.locator('[data-player]'));
      expect(media.cover, `${work.slug} cover`).toBeCloseTo(shape(work), 2);
      expect(media.video, `${work.slug} video`).toBeCloseTo(shape(work), 2);
    }
  });

  test('stand vertical reels in the phone on wider screens, and never on phones', async ({ page, isMobile }) => {
    await page.goto('');
    for (const work of works) {
      const phone = await phoneOf(pieceIn(page, work.slug));
      expect(phone !== null, work.slug).toBe(!isMobile && isFramed(shape(work)));
      if (phone) expect(phone.width / phone.height, `${work.slug} phone`).toBeCloseTo(PHONE_SHAPE, 2);
    }
  });

  test('fit on the first screen of their page, play button included', async ({ page }) => {
    const viewport = page.viewportSize()!;
    for (const work of works) {
      await page.goto(`work/${work.slug}/`);
      const frame = await outline(page.locator('.work__media'));
      expect(frame.y + frame.height, `${work.slug} frame bottom`).toBeLessThanOrEqual(viewport.height);
      expect(inside(await box(page.locator('.player__pill')), await box(page.locator('[data-player]'))), `${work.slug} play button`).toBe(true);
      const phone = await phoneOf(page.locator('.work__media'));
      expect(frame.width / frame.height, `${work.slug} shape`).toBeCloseTo(phone ? PHONE_SHAPE : shape(work), 2);
    }
  });
```

Replace the body of the `fit on one screen in the feed and keep their buttons whole` loop over works with:

```ts
        for (const work of works) {
          const piece = pieceIn(page, work.slug);
          const phone = await phoneOf(piece);
          const screen = await box(piece.locator('[data-player]'));
          const outer = phone ?? screen;
          const pill = await box(piece.locator('.player__pill'));
          const time = await box(piece.locator('.player__time'));
          if (outer.height > viewport.height) {
            // Only when the screen is too short for a frame its buttons fit in.
            expect(outer.width, `${path}${work.slug} is only as wide as its buttons need`).toBeLessThanOrEqual((phone ? MIN_PHONE_WIDTH : MIN_FRAME_WIDTH) + 1);
          }
          expect(inside(pill, screen), `${path}${work.slug} play button`).toBe(true);
          expect(inside(time, screen), `${path}${work.slug} duration`).toBe(true);
          expect(time.height, `${path}${work.slug} duration stays a small label`).toBeLessThan(40);
          expect(overlap(pill, time), `${path}${work.slug} play button clear of the duration`).toBe(false);
          if (phone) {
            const island = await box(piece.locator('.phone__island'));
            expect(overlap(island, pill), `${path}${work.slug} play button clear of the island`).toBe(false);
            expect(overlap(island, time), `${path}${work.slug} duration clear of the island`).toBe(false);
          }
        }
```

In `give every frame in a row of the grid one height…`, change `const frame = await box(frameIn(page, work.slug));` to `const frame = await outline(pieceIn(page, work.slug));`.

In the six-sizes test, change `const frame = await box(frameIn(page, work.slug));` to `const frame = await outline(article);`, add `const phone = (await phoneOf(article)) !== null;` and store `phone` in each row item (extend the item type with `phone: boolean`), and replace the "durations in a row line up" loop with:

```ts
      for (const line of lines) {
        // A phone's duration sits inside its bezel, so durations line up with their own kind.
        for (const kind of [true, false]) {
          const times = line.filter((item) => item.phone === kind).map((item) => item.time);
          if (times.length > 1) expect(Math.max(...times) - Math.min(...times), 'the durations in a row line up').toBeLessThanOrEqual(1);
        }
      }
```

Append two tests at the end of the describe block:

```ts
  test('ease a phone’s picture from filling its screen to whole when it plays with sound', async ({ page, isMobile }) => {
    test.skip(isMobile, 'The phone frame is for wider screens.');
    const work = works.find((w) => Math.abs(shape(w) - 9 / 16) < 0.01)!;
    await page.goto(`work/${work.slug}/`);
    const screen = await box(page.locator('[data-player]'));
    const picture = page.locator('[data-player] .player__media');
    const rest = await box(picture);
    expect(rest.width / rest.height).toBeCloseTo(9 / 16, 2);
    expect(rest.width, 'filled: a little of each side is cut').toBeGreaterThan(screen.width + 10);
    await page.locator('.player__play').click();
    await expect.poll(async () => {
      const now = await box(picture);
      return Math.abs(now.width - screen.width) <= 1 && inside(now, screen);
    }, { timeout: 5_000 }).toBe(true);
  });

  test('draw the phone in Safari, with round corners where corner-shape is missing', async ({ page, browserName }) => {
    test.skip(browserName !== 'webkit', 'A Safari check.');
    await page.setViewportSize({ width: 1024, height: 768 });
    const work = works.find((w) => isFramed(shape(w)))!;
    await page.goto(`work/${work.slug}/`);
    const phone = await phoneOf(page.locator('.work__media'));
    expect(phone, 'a phone at 1024 px').not.toBeNull();
    expect(phone!.width / phone!.height).toBeCloseTo(PHONE_SHAPE, 2);
    const screen = await box(page.locator('[data-player]'));
    expect(screen.width / screen.height).toBeCloseTo(SCREEN_SHAPE, 2);
    const corners = await page.locator('.phone--on').evaluate((el) => ({
      radius: parseFloat(getComputedStyle(el).borderTopLeftRadius) / el.getBoundingClientRect().width,
      shaped: CSS.supports('corner-shape', 'superellipse(1.38)'),
    }));
    // Round corners at 18.2% where corner-shape is missing (Safari today), the superellipse's 22.8% where it is not.
    expect(corners.radius).toBeCloseTo(corners.shaped ? 0.228 : 0.182, 2);
  });
```

- [ ] **Step 11: Run the tests**

Run: `npm test && npm run check && npm run build:e2e && npx playwright test tests/e2e/frames.spec.ts tests/e2e/player.spec.ts tests/e2e/home.spec.ts`
Expected: PASS in both projects. If a row at one of the six sizes is neither full nor height-capped, re-check the breakpoint that picked its layout against `scratchpad/rows-sim.mjs`-style arithmetic (list width `min(V, 1472) − 2·clamp(20, 13.6 + 0.02V, 48)`, gap `clamp(20, 8 + 0.02V, 40)`) before changing numbers.

- [ ] **Step 12: Look at it**

Scratch viewport and element screenshots (Chrome channel; not full-page, which misplaces transformed boxes in Chromium): the feed at 1440×900 (four a row), 1920×960 (three), 820×1180 (two), 844×390; a video page at 1280×720 and 1366×657; a phone playing with sound (after 700 ms); a close-up of one phone at 2× device scale. Check: rim bands, sheen, antenna break, buttons, island and lens as in the photo; the pill, duration and "Tap for sound" clear of the corners and island; the blurred bands while watching; no phone below 760 px.

- [ ] **Step 13: Commit**

```bash
git add src/lib/phone.ts src/lib/rows.ts src/components/WorkFeed.astro src/components/Reel.astro src/components/Player.astro src/scripts/player.ts tests/unit/phone.test.ts tests/unit/rows.test.ts tests/e2e/frames.spec.ts
git commit -m "Stand vertical reels in the cherry iPhone on wider screens, filled at rest and whole while playing"
```

---

## Task 6: The video page and the way back

**Files:**
- Modify: `src/pages/[...lang]/work/[slug].astro` (phone column, back link)
- Modify: `src/components/Reel.astro` (`id="reel-<slug>"`, scroll margin)
- Create: `tests/e2e/rules.spec.ts`
- Modify: `tests/e2e/frames.spec.ts` (column test)

**Interfaces:**
- Consumes: `pieceOf` (Task 5).
- Produces: `#reel-<slug>` anchors on feed pieces; back link `…/#reel-<slug>`.

- [ ] **Step 1: Write the failing tests**

Create `tests/e2e/rules.spec.ts`:

```ts
import { expect, test, type Page } from '@playwright/test';
import { videoState, works } from './helpers.ts';

const pieceIn = (page: Page, slug: string) => page.locator('[data-reel]').filter({ has: page.locator(`#title-${slug}`) });

test.describe('play here, open there', () => {
  test('a picture plays where it is, and the page stays', async ({ page }) => {
    await page.goto('');
    const url = page.url();
    await pieceIn(page, works[0]!.slug).locator('.player__play').click();
    await expect.poll(async () => (await videoState(page, '[data-reel] [data-player] >> nth=0')).time, { timeout: 15_000 }).toBeGreaterThan(0.3);
    expect(page.url()).toBe(url);
  });

  test('a title opens its page, and says so with an arrow that is not read out', async ({ page }) => {
    const work = works[1]!;
    await page.goto('');
    const link = page.locator(`#title-${work.slug} a`);
    await expect(link).toHaveAccessibleName(work.title.ar);
    await expect(link.locator('[aria-hidden="true"] .reel__go')).toHaveCount(1);
    await link.click();
    await expect(page).toHaveURL(new RegExp(`/work/${work.slug}/$`));
  });

  test('"All work" returns to the same piece, even the last one', async ({ page }) => {
    const work = works.at(-1)!;
    await page.goto(`work/${work.slug}/`);
    await expect(page.locator('.work__back')).toHaveAttribute('href', new RegExp(`/#reel-${work.slug}$`));
    await page.locator('.work__back').click();
    await expect(page).toHaveURL(new RegExp(`#reel-${work.slug}$`));
    const viewport = page.viewportSize()!;
    await expect
      .poll(async () => {
        const top = (await pieceIn(page, work.slug).boundingBox())?.y ?? -1;
        return top >= 0 && top < viewport.height / 3;
      })
      .toBe(true);
  });
});
```

Append to `tests/e2e/frames.spec.ts`:

```ts
  test('give a phone on its page a column exactly as wide as the phone, never too narrow for its play button', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Phones show one column.');
    const work = works.find((w) => isFramed(shape(w)))!;
    for (const size of [{ width: 1440, height: 900 }, { width: 1366, height: 657 }]) {
      await page.setViewportSize(size);
      await page.goto(`work/${work.slug}/`);
      const column = await box(page.locator('.work__media'));
      const phone = (await phoneOf(page.locator('.work__media')))!;
      expect(Math.abs(column.width - phone.width), `${size.width}×${size.height} column`).toBeLessThanOrEqual(1);
      expect(phone.width, `${size.width}×${size.height} phone`).toBeGreaterThanOrEqual(MIN_PHONE_WIDTH - 0.5);
    }
  });
```

- [ ] **Step 2: Run them to see them fail**

Run: `npm run build:e2e && npx playwright test tests/e2e/rules.spec.ts tests/e2e/frames.spec.ts -g "All work|column"`
Expected: FAIL — the back link ends with `#work`; the column is wider than the phone.

- [ ] **Step 3: The page** — `src/pages/[...lang]/work/[slug].astro`

Add `import { pieceOf } from '../../../lib/phone.ts';`; after `const landscape = …` add:

```ts
const ratio = ratioOf(work.width, work.height);
const piece = pieceOf(ratio);
// A phone keeps its screen wide enough for the play button, even on a short screen.
const layout = [`--r: ${ratio}`, `--shape: ${piece.shape}`, ...(piece.screen < 1 ? ['--least: var(--phone-min)'] : [])].join('; ');
```

Change the article's style to `style={layout}`.
Change the back link to `href={`${pageHref(lang)}#reel-${work.slug}`}`.
In the style, change the `@supports (height: 1svh)` column to:

```css
      .work__layout {
        grid-template-columns: min(56%, max(var(--least, 0px), var(--frame-h) * var(--shape))) minmax(0, 1fr);
      }
```

and its comment to: `/* The frame's column is exactly as wide as the frame (a phone, for a vertical reel, never narrower than --phone-min), up to a little over half the page, so a tall piece leaves the rest of the row to its text. */`

- [ ] **Step 4: The anchors** — `src/components/Reel.astro`

Add `id={`reel-${work.slug}`}` to the `<article>`, and to the `.reel` rule:

```css
    /* "All work" on a video page comes back to #reel-<slug>, with a little room above the frame. */
    scroll-margin-top: 1rem;
```

- [ ] **Step 5: Run the tests**

Run: `npm run build:e2e && npx playwright test tests/e2e/rules.spec.ts tests/e2e/frames.spec.ts tests/e2e/work.spec.ts`
Expected: PASS in both projects.

- [ ] **Step 6: Commit**

```bash
git add 'src/pages/[...lang]/work/[slug].astro' src/components/Reel.astro tests/e2e/rules.spec.ts tests/e2e/frames.spec.ts
git commit -m "Give a phone its own column on its page, and bring All work back to the same piece"
```

---

## Task 7: The glide

**Files:**
- Modify: `src/layouts/Base.astro` (`<head>` script: glide naming, expect link)
- Modify: `src/styles/global.css` (glide name and timing)
- Modify: `src/components/Player.astro` (drop `cover-<slug>`, add `data-frame`)
- Modify: `src/components/MoreWork.astro` (drop `cover-<slug>`, add `data-frame`)
- Modify: `tests/e2e/rules.spec.ts`

**Interfaces:**
- Consumes: `#reel-<slug>` (Task 6), `.phone--on` (Task 5).
- Produces: `data-frame="<slug>"` on the phone (framed), the player (always) and "More work" thumbnails; `.is-gliding` during a page change only.

- [ ] **Step 1: Write the failing tests** — append to `tests/e2e/rules.spec.ts`:

```ts
/** The frame pseudo-elements a paired glide animates (both sides named `frame`). */
const PAIRED = JSON.stringify(['::view-transition-group(frame)', '::view-transition-new(frame)', '::view-transition-old(frame)']);

test.describe('the glide', () => {
  test.beforeEach(async ({ page }) => {
    // Records, on each new page, what its view transition names and animates.
    await page.addInitScript(() => {
      addEventListener('pagereveal', (event) => {
        const transition = (event as Event & { viewTransition: ViewTransition | null }).viewTransition;
        if (!transition) return void sessionStorage.setItem('glide', 'none');
        transition.ready.then(
          () => {
            const named = [...document.querySelectorAll<HTMLElement>('body *')].filter((el) => getComputedStyle(el).viewTransitionName !== 'none');
            const frames = document
              .getAnimations()
              .map((a) => (a.effect as KeyframeEffect | null)?.pseudoElement ?? '')
              .filter((p) => p.includes('(frame)'));
            // Where the frame lands: it must be on screen, not where the piece was before a scroll.
            const rect = named[0]?.getBoundingClientRect();
            const onScreen = rect ? rect.bottom > 0 && rect.top < innerHeight : false;
            sessionStorage.setItem('glide', JSON.stringify({ named: named.map((el) => el.dataset.frame ?? el.tagName), frames: JSON.stringify([...new Set(frames)].sort()), onScreen }));
          },
          () => sessionStorage.setItem('glide', 'skipped'),
        );
      });
    });
  });
  const glide = (page: Page) => page.evaluate(() => sessionStorage.getItem('glide'));
  const expected = (slug: string) => JSON.stringify({ named: [slug], frames: PAIRED, onScreen: true });
  /** Lets the page render twice, then clears the record: WebKit sometimes skips a transition clicked for at once. */
  const settle = (page: Page) =>
    page.evaluate(
      () =>
        new Promise<void>((done) =>
          requestAnimationFrame(() =>
            requestAnimationFrame(() => {
              sessionStorage.removeItem('glide');
              done();
            }),
          ),
        ),
    );
  const open = async (page: Page, path: string) => {
    await page.goto(path);
    await settle(page);
  };

  test('moves only the opened piece’s frame to its page, and back to its place', async ({ page }) => {
    const work = works[2]!;
    await open(page, '');
    await page.locator(`#title-${work.slug} a`).click();
    await page.waitForURL(`**/work/${work.slug}/`);
    await expect.poll(() => glide(page)).toBe(expected(work.slug));
    await settle(page);
    await page.locator('.work__back').click();
    await page.waitForURL(`**/#reel-${work.slug}`);
    await expect.poll(() => glide(page)).toBe(expected(work.slug));
  });

  test('pairs the frame of the last piece too, when coming back to it', async ({ page }) => {
    const work = works.at(-1)!;
    await open(page, `work/${work.slug}/`);
    await page.locator('.work__back').click();
    await page.waitForURL(`**/#reel-${work.slug}`);
    await expect.poll(() => glide(page)).toBe(expected(work.slug));
  });

  test('moves a "More work" thumbnail into its page', async ({ page }) => {
    const [from, to] = [works[0]!, works[1]!];
    await open(page, `work/${from.slug}/`);
    await page.locator(`.more a[href$="/work/${to.slug}/"]`).click();
    await page.waitForURL(`**/work/${to.slug}/`);
    await expect.poll(() => glide(page)).toBe(expected(to.slug));
  });

  test('sends no frame off screen when going home by the name in the header', async ({ page }) => {
    const work = works.at(-1)!;
    await open(page, `work/${work.slug}/`);
    await page.locator('.site-header__name').click();
    await page.waitForURL((url) => !url.pathname.includes('/work/'));
    await expect.poll(() => glide(page)).not.toBeNull();
    // Either no transition ran, or it named nothing on the new page.
    const record = (await glide(page))!;
    expect(record === 'none' || JSON.parse(record).named.length === 0, record).toBe(true);
  });

  test('names no frame outside a page change, even after going back', async ({ page }) => {
    const work = works[0]!;
    await page.goto('');
    await expect(page.locator('.is-gliding')).toHaveCount(0);
    await page.locator(`#title-${work.slug} a`).click();
    await page.waitForURL(`**/work/${work.slug}/`);
    await expect(page.locator('.is-gliding')).toHaveCount(0);
    await page.goBack();
    await page.waitForURL((url) => !url.pathname.includes('/work/'));
    await expect(page.locator('.is-gliding')).toHaveCount(0);
  });

  test.describe('with reduced motion', () => {
    test.use({ reducedMotion: 'reduce' });

    test('changes pages without a glide', async ({ page }) => {
      await open(page, '');
      await page.locator(`#title-${works[0]!.slug} a`).click();
      await page.waitForURL(`**/work/${works[0]!.slug}/`);
      await expect.poll(() => glide(page)).toBe('none');
    });
  });
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `npm run build:e2e && npx playwright test tests/e2e/rules.spec.ts -g glide`
Expected: FAIL — `named` lists `PICTURE` covers (the static `cover-<slug>` names), no `(frame)` animations.

- [ ] **Step 3: The names move to data** — `src/components/Player.astro` and `src/components/MoreWork.astro`

Player: remove `style={`view-transition-name: cover-${work.slug}`}` from `<picture class="player__cover">`; add `data-frame={framed ? work.slug : undefined}` to the `.phone` div and `data-frame={work.slug}` to the `.player` div.
MoreWork: change the thumbnail's style to `style={`background-color: ${work.cover.color}`}` and add `data-frame={work.slug}`.

- [ ] **Step 4: The glide's name and timing** — `src/styles/global.css`, after `@view-transition { navigation: auto; }`:

```css
/* The frame of the piece being opened, or returned to, glides between the feed and its page (the
   <head> script in Base.astro names it as the page changes); the rest of the page cross-fades. */
.is-gliding {
  view-transition-name: frame;
}

::view-transition-group(frame) {
  animation-duration: var(--glide);
  animation-timing-function: var(--ease-cut);
}
```

- [ ] **Step 5: Naming per page change** — replace the `<head>` script in `src/layouts/Base.astro` with:

```astro
    <script is:inline>
      (() => {
        const root = document.documentElement;
        const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
        // Arriving at a #fragment (#reel-<slug>, #about) jumps there: the page's smooth scrolling is for
        // links within it, so it waits until the page has loaded.
        if (location.hash) {
          root.style.scrollBehavior = 'auto';
          addEventListener('load', () => requestAnimationFrame(() => root.style.removeProperty('scroll-behavior')), { once: true });
        }
        // Text builds like Mahmoud's captions only where JavaScript runs and the visitor allows motion
        // (src/styles/motion.css). If the motion script has not started 4 s in (a failed download), the
        // text is shown plain.
        if (!still && 'IntersectionObserver' in window) {
          root.classList.add('motion');
          setTimeout(() => root.classList.contains('motion-ready') || root.classList.remove('motion'), 4000);
        }

        // The frame glides between a piece in the feed and its page (a cross-document view transition).
        // Only the piece being opened, or returned to, is named as the page changes, and only while it is
        // on screen, so no other frame moves and none flies off screen: .is-gliding on its phone or
        // player, or on its "More work" thumbnail. Slugs are plain ASCII, so paths are compared as they are.
        const slugOf = (url) => {
          if (!url) return null;
          try {
            const address = new URL(url, location.href);
            const match = address.origin === location.origin && /\/work\/([^/?#]+)\//.exec(address.pathname);
            return match ? match[1] : null;
          } catch {
            return null;
          }
        };
        const onScreen = (el) => {
          if (el.getClientRects().length === 0) return false;
          const { top, bottom } = el.getBoundingClientRect();
          return bottom > 0 && top < innerHeight;
        };
        const glide = (slug) => {
          for (const el of document.querySelectorAll('.is-gliding')) el.classList.remove('is-gliding');
          const frame = slug && [...document.querySelectorAll('[data-frame]')].find((el) => el.dataset.frame === slug && onScreen(el));
          if (frame) frame.classList.add('is-gliding');
        };
        const from = () => globalThis.navigation?.activation?.from?.url ?? document.referrer;
        // "All work" comes back to #reel-<slug>: hold the first frame until that piece has arrived, and
        // jump to it before the page is revealed, so its frame glides into its own slot.
        const back = slugOf(location.href) ? null : slugOf(from());
        const arriving = back && location.hash === `#reel-${back}` ? back : null;
        if (arriving && !still) {
          const expect = document.createElement('link');
          expect.rel = 'expect';
          expect.href = `#reel-${arriving}`;
          expect.setAttribute('blocking', 'render');
          document.head.append(expect);
        }
        let fresh = true;
        let clicked;
        addEventListener('click', (event) => (clicked = event.target.closest?.('a[href]')?.href), true);
        addEventListener('pageshow', (event) => event.persisted && (clicked = undefined));
        addEventListener('pageswap', (event) => {
          if (event.viewTransition) glide(slugOf(event.activation?.entry?.url ?? clicked) ?? slugOf(location.href));
        });
        addEventListener('pagereveal', (event) => {
          // Only on the first reveal: a page restored by Back keeps the scroll it had.
          if (fresh && arriving) document.getElementById(`reel-${arriving}`)?.scrollIntoView({ block: 'start', behavior: 'instant' });
          fresh = false;
          if (!event.viewTransition) return glide(null);
          glide(slugOf(location.href) ?? slugOf(from()));
          event.viewTransition.finished.finally(() => glide(null));
        });
      })();
    </script>
```

- [ ] **Step 6: Run the tests**

Run: `npm run build:e2e && npx playwright test tests/e2e/rules.spec.ts tests/e2e/motion.spec.ts tests/e2e/frames.spec.ts`
Expected: PASS in both projects (the probe showed Chromium and WebKit both fire `pageswap`/`pagereveal` with `navigation.activation`).

- [ ] **Step 7: Look at it**

Scratch (Chrome channel, 1440×900): click a title, pause the view-transition animations at 0, 200, 400 and 620 ms (`document.getAnimations().forEach(a => { a.pause(); a.currentTime = t })` in `pagereveal`'s `ready`), screenshot each; same for "All work" and a "More work" thumbnail. Expected: only that frame travels; the rest cross-fades; the phone lands exactly in its slot.

- [ ] **Step 8: Commit**

```bash
git add src/layouts/Base.astro src/styles/global.css src/components/Player.astro src/components/MoreWork.astro tests/e2e/rules.spec.ts
git commit -m "Glide only the opened piece's frame between the feed and its page"
```

---

## Task 8: Whole-suite verification and Lighthouse

**Files:** whatever the fixes touch; no new features.

- [ ] **Step 1: Types and unit tests**

Run: `npm run check && npm test`
Expected: 0 errors; all unit tests pass (the HDR integration test may skip with Homebrew ffmpeg, as before).

- [ ] **Step 2: The whole end-to-end suite, both projects**

Run: `npm run build:e2e && npx playwright test`
Expected: all pass. Fix any failure at its cause (never loosen a test to pass), re-run, and commit each fix separately with a message naming what it fixes.

- [ ] **Step 3: The JavaScript budget**

Confirm `home.spec.ts › stays light on first load` passed; note the JS bytes it measured (`npx playwright test -g "stays light" --project=desktop-chromium --reporter=line`, adding a temporary `console.log(js)` locally if needed and removing it before any commit).

- [ ] **Step 4: Lighthouse on the production build**

Run: `npm run lighthouse`
Expected: every row in the printed table ≥ 95 for Performance, Accessibility, Best practices and SEO (home-ar, home-en, work-ar; mobile and desktop), CLS 0. If Performance drops below 95, compare against `git stash`-free evidence: rebuild `main` in a worktree (`git worktree add ../mk-main main`) and run Lighthouse there to tell regressions from noise; fix regressions.

- [ ] **Step 5: Record the numbers**

Keep the Lighthouse table and the e2e totals (passed/skipped per project) for the final report. Every fix from Steps 2–4 is already committed on its own, with a message that names what it fixes (for example "Keep the island clear of the duration on 1366×657 phones").

---

## Task 9: Manual verification, screenshots and docs

**Files:**
- Modify: `README.md`
- Modify/Create: `docs/screenshots/*.jpg`

- [ ] **Step 1: Production build for the real catalog**

Run: `npm run build` then `npm run serve` (serves `dist/` at `http://localhost:4747/mahmoud-khaled/` and on the LAN).

- [ ] **Step 2: Chrome at phone and laptop sizes**

Scratch script with `playwright-core` `chromium.launch({ channel: 'chrome' })`: 390×844 (mobile, touch), 820×1180, 1280×720, 1440×900, 1920×960 — home (after 4.5 s), the feed, a video page, a phone playing with sound, Arabic and English; viewport or element screenshots only. View every screenshot. Checklist: builds complete, gold keys, kashida visible mid-way, arrows point the reading way (an English title on the Arabic page points right), rows full, phones match the photo, nothing clipped, no horizontal scroll.

- [ ] **Step 3: The overlay check against the photo**

Scratch scripts (drafts at `/private/tmp/claude-501/-Users-omarhanafy-Development-MyProjects-mahmouds-portfolio-c/7051f458-97a2-484f-ab70-582cdddd4d38/scratchpad/overlay/render.mjs` and `overlay.py`; if they are gone, this step's text is enough to write them again): open a framed video page at a 1400×2800 viewport, set `--phone-w: 1209.8px` on `.phone--on` through `page.addStyleTag`, hide the screen's contents (`.player > * { visibility: hidden }`, `.player { background: transparent }`), screenshot the phone's box plus 10 px with `omitBackground` (so the buttons are in it), rotate it 90° counter-clockwise (PIL `rotate(90, expand=True)`), and lay it over `.superpowers/brainstorm/7709-1790516907/content/reference-full.jpg` (2528 × 1228; the phone lies on its side there, island on the left, outline from (1.1, 8.6)) at 50% opacity. Also compute, row by row and column by column, the outer edge of the phone in both images (the first pixel brighter than the photo's black background from each side) and report the largest difference. Expected: ≤ 2 px at this 1210 px phone (about 0.2 px at feed sizes), island, lens and buttons visibly on top of the photo's.

- [ ] **Step 4: Mobile Safari and iPad in the Simulator**

Boot an iPhone (iOS 26.4) and an iPad (portrait; iOS 18.6 and 26.4) simulator; `xcrun simctl openurl booted http://<LAN IP>:4747/mahmoud-khaled/`; screenshot with `xcrun simctl io booted screenshot <file>`. On each, record whether its Safari supports `corner-shape`: in macOS Safari, Develop → (the simulator) → the page → Console, run `CSS.supports('corner-shape', 'superellipse(1.38)')`. Check on iPhone: no phone frame, hero builds, titles with arrows, tap a picture plays inline with sound, title opens the page; on iPad: phones in rows of two, corners matching what that Safari supports (round at 18.2% without `corner-shape`), playing with sound eases to whole, the glide between pages.

- [ ] **Step 5: Refresh the screenshots**

Replace `docs/screenshots/chrome-desktop-home-ar.jpg`, `chrome-desktop-work-grid.jpg`, `chrome-desktop-video-page.jpg`, `chrome-phone-home-and-video-page.jpg`, `chrome-phone-feed-ar-and-home-en.jpg`, `ios-safari-feed-muted-preview.jpg` with the new captures (JPEG, quality 82, at most 1600 px wide), and add `chrome-desktop-phone-playing.jpg` and `ios-ipad-work-grid.jpg`.

- [ ] **Step 6: README**

In "How it works", replace the "Frames" and "Rows" bullets and add "Motion":

```markdown
- **Frames**: each frame takes its video's own shape at the largest size that fits the screen with its
  play button, so nothing is stretched or cropped: films run wide, squares stay square. On screens
  760 px and wider, vertical reels stand in a drawn iPhone (cherry, measured on Apple's photo;
  `src/lib/phone.ts`, drawn in `Player.astro`): the reel fills its 9:19.5 screen at rest and eases to
  its whole 9:16 frame when it plays with sound. On phones a frame runs edge to edge when it fits and
  otherwise sits centred.
- **Rows** (`src/lib/rows.ts`): on wider screens the pieces sit in rows in Mahmoud's order, every
  piece in a row at one height so the row fills the width and titles line up. A framed reel counts as
  its phone. Films get a row of their own and the next pieces move up to finish the row before; the
  screen's shape picks two, three or four a row so a row fits the screen.
- **Motion** ("Captions"): text builds the way his reels build captions. The hero line pops on word by
  word with «كتابة متحركة» in gold and «متحركة» stretching with kashida; headings, feed titles, the
  services and a video's title build as they come into view (`src/lib/words.ts`, `Words.astro`,
  `src/styles/motion.css`, `src/scripts/motion.ts`). Screen readers read every line whole; with
  Reduce Motion or without JavaScript the text is simply there.
- **Play here, open there**: tapping a picture plays it where it is; tapping a title (it carries an
  arrow) opens its page, and the frame glides there and back (a view transition named per page
  change in `Base.astro`). "All work" returns to the same piece.
```

In the "Site" bullet change the JavaScript sentence to: `The only JavaScript is the player (src/scripts/player.ts, ~2.5 KB gzipped), the share button and the motion script (src/scripts/motion.ts, inlined), plus a small inline script in <head>.`
In "Tests", extend the e2e list with: `motion (word-by-word builds, gold key words, kashida without layout shift, reduced motion, no JavaScript), the phone frame (9:19.5 screen, fill and whole, clear of its island, Safari's round corners) and the rules (a picture plays in place, a title opens its page, the glide pairs one frame each way, "All work" returns to the piece)`.

- [ ] **Step 7: Final review**

Dispatch a fresh reviewer (most capable model) on the whole branch against the spec and this plan; fix what it confirms; re-run Task 8 Steps 1–2 after fixes.

- [ ] **Step 8: Commit and tidy up**

```bash
git add README.md docs/screenshots
git commit -m "Document motion, the phone frame and the play/open rules; refresh screenshots"
```

Stop the brainstorming companion: `bash /Users/omarhanafy/.claude/plugins/cache/claude-plugins-official/superpowers/6.4.1/skills/brainstorming/scripts/stop-server.sh .superpowers/brainstorm/7709-1790516907`. Leave the branch unpushed.
