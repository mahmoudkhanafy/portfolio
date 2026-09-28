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

/** schema.org WebSite for the home page: search results show its name as the site's name. */
export function websiteLd(opts: { url: string; lang: Lang }) {
  const [name, alternateName] = opts.lang === 'ar' ? ['محمود خالد', 'Mahmoud Khaled'] : ['Mahmoud Khaled', 'محمود خالد'];
  return { '@context': context, '@type': 'WebSite', name, alternateName, url: opts.url, inLanguage: opts.lang };
}

/** schema.org ProfilePage for the home page, which is about Mahmoud. */
export function profilePageLd(opts: { url: string; image: string; lang: Lang }) {
  const { '@context': _, ...person } = personLd(opts);
  return { '@context': context, '@type': 'ProfilePage', url: opts.url, inLanguage: opts.lang, mainEntity: person };
}

/** schema.org BreadcrumbList: the trail from the home page to this one. */
export function breadcrumbLd(trail: Array<{ name: string; url: string }>) {
  return {
    '@context': context,
    '@type': 'BreadcrumbList',
    itemListElement: trail.map(({ name, url }, i) => ({ '@type': 'ListItem', position: i + 1, name, item: url })),
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
  /** His home page in the page's language. */
  creatorUrl: string;
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
    creator: { '@type': 'Person', name: 'Mahmoud Khaled', url: opts.creatorUrl },
  };
}
