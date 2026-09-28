import data from '../generated/catalog.json';
import type { Catalog, Work } from './catalog-types.ts';

export type { Catalog, ImageSource, Portrait, Rendition, Work } from './catalog-types.ts';

/** Written by `npm run media` from the work/ folder; ordered for display. */
export const catalog = data as Catalog;
export const works: Work[] = catalog.works;

export const getWork = (slug: string): Work | undefined => works.find((w) => w.slug === slug);
