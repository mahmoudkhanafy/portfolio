import type { Catalog, Work } from './catalog-types.ts';
import { ui } from './i18n.ts';
import { pick } from './localize.ts';
import { OLD_BASE, OLD_ENGLISH, type Lang } from './urls.ts';

/** A piece's title and search/preview description in a page language. */
export function workMeta(work: Work, lang: Lang): { title: string; description: string } {
  const description = pick(work.description, lang);
  return { title: pick(work.title, lang)!.text, description: description?.lang === lang ? description.text : ui[lang].workFallbackDescription };
}

interface Entry {
  url: string;
}

interface Found {
  lastmod?: string;
  img?: Array<{ url: string }>;
  video?: Array<{ thumbnail_loc: string; title: string; description: string; content_loc: string; duration: number; publication_date: string }>;
}

/**
 * A sitemap entry (@astrojs/sitemap `serialize`) with what search engines can list from the page: a
 * video page's video and preview image, a home page's portrait, and when each last changed.
 * `root` is the site's absolute address, base path included.
 */
export function sitemapEntry<T extends Entry>(item: T, catalog: Catalog, root: string): T & Found {
  const path = item.url.startsWith(root) ? item.url.slice(root.length) : '';
  const match = /^(ar\/)?(?:work\/([^/]+)\/)?$/.exec(path);
  if (!match) return item;
  const lang: Lang = match[1] ? 'ar' : 'en';
  const at = (src: string): string => root + src;
  const work = match[2] && catalog.works.find((w) => w.slug === match[2]);
  if (work) {
    const { title, description } = workMeta(work, lang);
    const image = at(work.og[lang].src);
    return {
      ...item,
      lastmod: work.addedAt,
      img: [{ url: image }],
      video: [
        {
          thumbnail_loc: image,
          title,
          description,
          content_loc: at(work.renditions[0]!.src),
          duration: Math.round(work.duration),
          publication_date: work.addedAt,
        },
      ],
    };
  }
  if (match[2]) return item;
  const newest = catalog.works.map((w) => w.addedAt).sort().at(-1);
  const portrait = catalog.portrait?.webp.at(-1);
  return { ...item, ...(newest && { lastmod: newest }), ...(portrait && { img: [{ url: at(portrait.src) }] }) };
}

/** Every page but those that only send old links on. */
export const inSitemap = (page: string, root: string): boolean => ![OLD_BASE, OLD_ENGLISH].some((old) => page.startsWith(root + old));
