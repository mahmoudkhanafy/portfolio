export type Lang = 'ar' | 'en';

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

/** Path of a page (without the base): English lives at the root, Arabic under ar/. */
export function pagePath(lang: Lang, slug?: string): string {
  const prefix = lang === 'ar' ? 'ar/' : '';
  return slug ? `${prefix}work/${slug}/` : prefix;
}
