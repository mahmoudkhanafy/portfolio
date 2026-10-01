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
export const otherLang = (lang: Lang): Lang => (lang === 'ar' ? 'en' : 'ar');
export const dirOf = (lang: Lang): 'rtl' | 'ltr' => (lang === 'ar' ? 'rtl' : 'ltr');
