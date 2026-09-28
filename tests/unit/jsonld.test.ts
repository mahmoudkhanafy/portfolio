import { describe, expect, it } from 'vitest';
import { jsonLdScript } from '../../src/lib/jsonld.ts';

describe('jsonLdScript', () => {
  const data = { name: 'A </script><img src=x onerror=alert(1)> & «B»', sep: 'line\u2028para\u2029end' };
  const out = jsonLdScript(data);

  it('cannot close the surrounding script element', () => {
    expect(out).not.toContain('</script');
    expect(out).not.toMatch(/[<>&\u2028\u2029]/);
  });

  it('still parses back to the same data', () => {
    expect(JSON.parse(out)).toEqual(data);
  });
});

import { breadcrumbLd, personLd, profilePageLd, videoLd, websiteLd } from '../../src/lib/jsonld.ts';

describe('personLd', () => {
  it('describes Mahmoud with his contact and profiles', () => {
    expect(personLd({ url: 'https://e.github.io/r/', image: 'https://e.github.io/r/media/portrait/p.webp' })).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: 'Mahmoud Khaled',
      alternateName: 'محمود خالد',
      jobTitle: 'Video editor and videographer',
      url: 'https://e.github.io/r/',
      image: 'https://e.github.io/r/media/portrait/p.webp',
      telephone: '+201156379179',
      email: 'mailto:mahmoud.kh.hanafy@gmail.com',
      address: { '@type': 'PostalAddress', addressLocality: 'Giza', addressCountry: 'EG' },
      sameAs: ['https://www.instagram.com/mahmoud_khaled.0/'],
      knowsAbout: ['Premiere Pro', 'After Effects', 'DaVinci Resolve', 'Photoshop'],
    });
  });
});

describe('videoLd', () => {
  it('describes one piece for search engines', () => {
    const ld = videoLd({
      name: 'Run',
      description: 'A run.',
      pageUrl: 'https://e.github.io/r/en/work/run/',
      contentUrl: 'https://e.github.io/r/media/run/hd.k.mp4',
      thumbnails: ['https://e.github.io/r/media/run/og.k.jpg', 'https://e.github.io/r/media/run/cover-720.k.jpg'],
      uploadDate: '2026-09-23T08:00:00.000Z',
      duration: 19.4,
      width: 1920,
      height: 1080,
      lang: 'en',
      creatorUrl: 'https://e.github.io/r/en/',
    });
    expect(ld).toEqual({
      '@context': 'https://schema.org',
      '@type': 'VideoObject',
      name: 'Run',
      description: 'A run.',
      url: 'https://e.github.io/r/en/work/run/',
      contentUrl: 'https://e.github.io/r/media/run/hd.k.mp4',
      thumbnailUrl: ['https://e.github.io/r/media/run/og.k.jpg', 'https://e.github.io/r/media/run/cover-720.k.jpg'],
      uploadDate: '2026-09-23T08:00:00.000Z',
      duration: 'PT19S',
      width: 1920,
      height: 1080,
      inLanguage: 'en',
      creator: { '@type': 'Person', name: 'Mahmoud Khaled', url: 'https://e.github.io/r/en/' },
    });
  });
});

describe('websiteLd', () => {
  it('names the site in the language of its home page, so results show his name as the site name', () => {
    expect(websiteLd({ url: 'https://e.github.io/', lang: 'ar' })).toEqual({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'محمود خالد',
      alternateName: 'Mahmoud Khaled',
      url: 'https://e.github.io/',
      inLanguage: 'ar',
    });
    expect(websiteLd({ url: 'https://e.github.io/en/', lang: 'en' })).toMatchObject({ name: 'Mahmoud Khaled', alternateName: 'محمود خالد', inLanguage: 'en' });
  });
});

describe('profilePageLd', () => {
  it('presents the home page as the profile of Mahmoud', () => {
    const opts = { url: 'https://e.github.io/en/', image: 'https://e.github.io/media/portrait/p.webp' };
    const { '@context': _, ...person } = personLd(opts);
    expect(profilePageLd({ ...opts, lang: 'en' })).toEqual({
      '@context': 'https://schema.org',
      '@type': 'ProfilePage',
      url: 'https://e.github.io/en/',
      inLanguage: 'en',
      mainEntity: person,
    });
  });
});

describe('breadcrumbLd', () => {
  it('lists the trail from the home page, numbered from 1', () => {
    expect(
      breadcrumbLd([
        { name: 'All work', url: 'https://e.github.io/en/' },
        { name: 'Run', url: 'https://e.github.io/en/work/run/' },
      ]),
    ).toEqual({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'All work', item: 'https://e.github.io/en/' },
        { '@type': 'ListItem', position: 2, name: 'Run', item: 'https://e.github.io/en/work/run/' },
      ],
    });
  });
});
