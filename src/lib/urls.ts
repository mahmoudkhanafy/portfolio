export type Lang = 'ar' | 'en';

/** Where the site lived until it moved to the root of mahmoudkhanafy.github.io: links shared before
 * then still open, through small pages under it that send them on (src/pages/portfolio/). */
export const OLD_BASE = 'portfolio/';

/** "/repo", "repo/", "" → "/repo/" or "/". */
export function normalizeBase(base: string): string {
  const trimmed = base.trim().replace(/^\/+|\/+$/g, '');
  return trimmed ? `/${trimmed}/` : '/';
}

/** A path inside the site ("work/x/", "media/a.mp4") joined to the site's base path. */
export function withBase(path: string, base: string): string {
  return normalizeBase(base) + path.replace(/^\/+/, '');
}

/** Absolute URL for link previews and canonical tags: origin + base + path. */
export function absoluteUrl(path: string, site: string, base: string): string {
  return site.replace(/\/+$/, '') + withBase(path, base);
}

/** Path of a page (without the base): Arabic lives at the root, English under en/. */
export function pagePath(lang: Lang, slug?: string): string {
  const prefix = lang === 'en' ? 'en/' : '';
  return slug ? `${prefix}work/${slug}/` : prefix;
}
