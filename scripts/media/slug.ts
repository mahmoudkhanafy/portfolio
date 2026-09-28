import { createHash } from 'node:crypto';

/** URL-safe slug from any file name. Names with no Latin letters or digits get a stable "video-xxxxxx". */
export function slugify(name: string): string {
  const slug = name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '');
  return slug || `video-${createHash('sha1').update(name).digest('hex').slice(0, 6)}`;
}

/** "nimun_recap-2025" → "Nimun recap 2025": a readable title for a video uploaded without an info file. */
export function titleFromFileName(stem: string): string {
  const words = stem.replace(/[-_.]+/g, ' ').replace(/\s+/g, ' ').trim();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : stem;
}
