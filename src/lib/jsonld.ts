import { CONTACT } from './contact.ts';
import { TOOLS } from './i18n.ts';
import { isoDuration } from './time.ts';
import type { Lang } from './urls.ts';

/** JSON for a <script type="application/ld+json"> body that page text can never break out of. */
export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(/[<>&\u2028\u2029]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`);
}


const context = 'https://schema.org';

/** schema.org Person for the home page. */
export function personLd(opts: { url: string; image: string }) {
  return {
    '@context': context,
    '@type': 'Person',
    name: 'Mahmoud Khaled',
    alternateName: 'محمود خالد',
    jobTitle: 'Video editor and videographer',
    url: opts.url,
    image: opts.image,
    telephone: CONTACT.phoneE164,
    email: `mailto:${CONTACT.email}`,
    address: { '@type': 'PostalAddress', addressLocality: 'Giza', addressCountry: 'EG' },
    sameAs: [CONTACT.instagramUrl],
    knowsAbout: [...TOOLS],
  };
}

/** schema.org VideoObject for one piece's page. */
export function videoLd(opts: {
  name: string;
  description: string;
  pageUrl: string;
  contentUrl: string;
  thumbnails: string[];
  uploadDate: string;
  duration: number;
  width: number;
  height: number;
  lang: Lang;
}) {
  return {
    '@context': context,
    '@type': 'VideoObject',
    name: opts.name,
    description: opts.description,
    url: opts.pageUrl,
    contentUrl: opts.contentUrl,
    thumbnailUrl: opts.thumbnails,
    uploadDate: opts.uploadDate,
    duration: isoDuration(opts.duration),
    width: opts.width,
    height: opts.height,
    inLanguage: opts.lang,
    creator: { '@type': 'Person', name: 'Mahmoud Khaled' },
  };
}
