/**
 * Text that builds the way Mahmoud's reels build captions (spec §2): a line split into the words that
 * pop on one at a time, the key words marked gold, and on an Arabic line one word that stretches with
 * kashida. Runs at build time; Words.astro renders the words as spans with their delays.
 */

export type Dir = 'rtl' | 'ltr';

/** A line, with its key words and, optionally, the one word that stretches. */
export interface Caption {
  text: string;
  /** The words shown in the key colour, as they appear in `text`; trailing punctuation may be left off. */
  key?: string;
  /** A word that stretches with kashida as it appears (Arabic). */
  stretch?: string;
  /** The word after which the line breaks, so a caption of two sentences shows one to a line. */
  breakAfter?: string;
}

export interface Rhythm {
  /** When the first word appears, in ms. */
  start?: number;
  /** From one word to the next, in ms. */
  step: number;
  /** An extra beat after a comma or the end of a sentence, in ms. */
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
  /** The line breaks after it. */
  breakAfter?: true;
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
const JOINS_NEXT = /[\u0626\u0628\u062A-\u062E\u0633-\u063F\u0641-\u0647\u0649\u064A]/u;
/** Letters that join the letter before them (joining types D and R). */
const JOINS_PREVIOUS = /[\u0622-\u063F\u0641-\u064A]/u;
/** Vowel marks, which stay with their letter. */
const MARK = /[\u064B-\u065F\u0670]/u;

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
  const broken = caption.breakAfter ? find(texts, caption.breakAfter, dir)[0] : undefined;
  const words = texts.map((text, i): Word => {
    const word: Word = { text, key: keys.has(i), delay: 0 };
    if (i === broken) word.breakAfter = true;
    if (i === stretched) {
      const at = kashidaAt(text);
      if (at === null) throw new Error(`"${text}" has no letter a kashida can follow`);
      word.kashida = at;
    }
    return word;
  });
  // From one word to the next: a step, a beat more after a comma or a sentence, a wait while a word stretches.
  const { start = 0, step, comma = 0, stretch = 0, most = Infinity } = rhythm;
  const gaps = words.slice(0, -1).map((word) => {
    const gap = step + (/[،,.؟?!]$/u.test(word.text) ? comma : 0);
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
