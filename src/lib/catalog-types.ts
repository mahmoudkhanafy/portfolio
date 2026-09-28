import type { WorkType } from './i18n.ts';
import type { Lang } from './urls.ts';

export interface ImageSource {
  src: string;
  width: number;
}

export interface Rendition {
  id: 'hd' | 'sd';
  src: string;
  width: number;
  height: number;
  /** Average bits per second of the encoded file. */
  bitrate: number;
  bytes: number;
}

export interface OgImage {
  src: string;
  width: number;
  height: number;
  bytes: number;
}

export interface Work {
  slug: string;
  title: { ar: string; en: string | null };
  description: { ar: string | null; en: string | null };
  type: WorkType;
  client: string | null;
  role: { ar: string | null; en: string | null };
  order: number;
  addedAt: string;
  width: number;
  height: number;
  duration: number;
  fps: number;
  hasAudio: boolean;
  /** hd first, then sd when the source is big enough for two. */
  renditions: Rendition[];
  cover: {
    width: number;
    height: number;
    color: string;
    lqip: string;
    avif: ImageSource[];
    webp: ImageSource[];
    jpg: ImageSource;
  };
  /** The link-preview image for each page language (its name label reads in that language first). */
  og: Record<Lang, OgImage>;
}

export interface Portrait {
  width: number;
  height: number;
  avif: ImageSource[];
  webp: ImageSource[];
  png: ImageSource;
}

export interface Catalog {
  works: Work[];
  portrait: Portrait | null;
}
