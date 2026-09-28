import { describe, expect, it } from 'vitest';
import type { Catalog, Work } from '../../src/lib/catalog-types.ts';
import { inSitemap, sitemapEntry, workMeta } from '../../src/lib/seo.ts';

const og = (lang: string) => ({ src: `media/run/og-${lang}.k.jpg`, width: 1200, height: 630, bytes: 1 });
const work = (over: Partial<Work> = {}): Work => ({
  slug: 'run',
  title: { ar: 'جري', en: 'Run' },
  description: { ar: 'فيلم جري.', en: 'A running film.' },
  type: 'film',
  client: null,
  role: { ar: null, en: null },
  order: 1,
  addedAt: '2026-09-21T13:55:49.407Z',
  width: 1920,
  height: 1080,
  duration: 19.6,
  fps: 25,
  hasAudio: true,
  renditions: [{ id: 'hd', src: 'media/run/hd.k.mp4', width: 1920, height: 1080, bitrate: 1, bytes: 1 }],
  cover: { width: 1920, height: 1080, color: '#000', lqip: '', avif: [], webp: [], jpg: { src: 'media/run/cover-720.k.jpg', width: 720 } },
  og: { ar: og('ar'), en: og('en') },
  ...over,
});
const catalog = (works: Work[]): Catalog => ({
  works,
  portrait: { width: 1200, height: 2000, avif: [], webp: [{ src: 'media/portrait/p-720.k.webp', width: 720 }], png: { src: 'media/portrait/p.k.png', width: 1200 } },
});
const root = 'https://e.github.io/';

describe('workMeta', () => {
  it('uses the page language, and the fallback line when the piece has no description in it', () => {
    expect(workMeta(work(), 'en')).toEqual({ title: 'Run', description: 'A running film.' });
    expect(workMeta(work({ description: { ar: 'فيلم جري.', en: null } }), 'en')).toEqual({
      title: 'Run',
      description: 'A video by Mahmoud Khaled, video editor and videographer in Giza.',
    });
  });
});

describe('sitemapEntry', () => {
  it('lists a video page with its video, preview image and date', () => {
    expect(sitemapEntry({ url: `${root}en/work/run/`, links: [] }, catalog([work()]), root)).toEqual({
      url: `${root}en/work/run/`,
      links: [],
      lastmod: '2026-09-21T13:55:49.407Z',
      img: [{ url: `${root}media/run/og-en.k.jpg` }],
      video: [
        {
          thumbnail_loc: `${root}media/run/og-en.k.jpg`,
          title: 'Run',
          description: 'A running film.',
          content_loc: `${root}media/run/hd.k.mp4`,
          duration: 20,
          publication_date: '2026-09-21T13:55:49.407Z',
        },
      ],
    });
  });

  it('describes the Arabic page in Arabic', () => {
    const entry = sitemapEntry({ url: `${root}work/run/` }, catalog([work()]), root);
    expect(entry.video?.[0]).toMatchObject({ title: 'جري', description: 'فيلم جري.', thumbnail_loc: `${root}media/run/og-ar.k.jpg` });
  });

  it('dates a home page by its newest piece and lists the portrait', () => {
    const works = [work(), work({ slug: 'new', addedAt: '2026-09-25T10:00:00.000Z' })];
    expect(sitemapEntry({ url: `${root}en/` }, catalog(works), root)).toEqual({
      url: `${root}en/`,
      lastmod: '2026-09-25T10:00:00.000Z',
      img: [{ url: `${root}media/portrait/p-720.k.webp` }],
    });
  });

  it('works under a sub-path too', () => {
    const at = 'https://e.github.io/repo/';
    expect(sitemapEntry({ url: `${at}work/run/` }, catalog([work()]), at).video?.[0]?.content_loc).toBe(`${at}media/run/hd.k.mp4`);
  });
});

describe('inSitemap', () => {
  it('leaves out the pages that only send old /portfolio/ links on', () => {
    expect(inSitemap(`${root}portfolio/en/`, root)).toBe(false);
    expect(inSitemap(`${root}en/work/run/`, root)).toBe(true);
    expect(inSitemap(root, root)).toBe(true);
  });
});
