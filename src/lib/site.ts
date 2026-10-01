import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { absoluteUrl, pagePath, withBase, type Lang } from './urls.ts';

// Astro fills these from `base` and `site` in astro.config.ts (BASE_PATH / SITE_URL at build time).
const BASE = import.meta.env.BASE_URL;
const SITE = import.meta.env.SITE ?? 'http://localhost:4750';

/** Root-relative URL for a path inside the site. */
export const href = (path: string): string => withBase(path, BASE);
/** Absolute URL for link previews, canonical tags and structured data. */
export const abs = (path: string): string => absoluteUrl(path, SITE, BASE);
export const pageHref = (lang: Lang, slug?: string): string => href(pagePath(lang, slug));
export const pageAbs = (lang: Lang, slug?: string): string => abs(pagePath(lang, slug));
/**
 * Absolute URL of a file in public/ that keeps its name (a home card), versioned by its content: apps
 * that cached the old picture under the plain address fetch the new one.
 */
export const absVersioned = (file: string): string =>
  `${abs(file)}?v=${createHash('sha256').update(readFileSync(`public/${file}`)).digest('hex').slice(0, 10)}`;
export const otherLang = (lang: Lang): Lang => (lang === 'ar' ? 'en' : 'ar');
export const dirOf = (lang: Lang): 'rtl' | 'ltr' => (lang === 'ar' ? 'rtl' : 'ltr');
