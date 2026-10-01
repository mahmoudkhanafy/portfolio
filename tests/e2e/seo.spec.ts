import sharp from 'sharp';
import { expect, test } from '@playwright/test';
import { works } from './helpers.ts';

const slug = works[0]!.slug;
const lds = async (page: import('@playwright/test').Page) =>
  (await page.locator('script[type="application/ld+json"]').allTextContents()).map((text) => JSON.parse(text));

for (const [lang, path, card] of [
  ['ar', 'ar/', 'og-home-ar.jpg'],
  ['en', '', 'og-home-en.jpg'],
] as const) {
  test(`the ${lang} home page previews with its own card and tells search engines whose site it is`, async ({ page, request, baseURL }) => {
    await page.goto(path);
    const image = await page.locator('meta[property="og:image"]').getAttribute('content');
    // Versioned by content, so an app that cached an older card fetches the new one.
    expect(image).toMatch(new RegExp(`^${new URL(card, baseURL).href.replace(/\./g, '\\.')}\\?v=[0-9a-f]{10}$`));
    expect((await request.get(image!)).status()).toBe(200);
    await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute('content', image!);

    const url = new URL(path, baseURL).href;
    const data = await lds(page);
    expect(data.find((d) => d['@type'] === 'WebSite')).toMatchObject({ url, name: lang === 'ar' ? 'محمود خالد' : 'Mahmoud Khaled', inLanguage: lang });
    expect(data.find((d) => d['@type'] === 'ProfilePage')).toMatchObject({ url, mainEntity: { '@type': 'Person', name: 'Mahmoud Khaled', url } });
  });
}

test('the sitemap lists each video with its page, and when every page last changed', async ({ request, baseURL }) => {
  const sitemap = await (await request.get('sitemap-0.xml')).text();
  for (const work of works) {
    for (const path of [`ar/work/${work.slug}/`, `work/${work.slug}/`]) {
      const entry = new RegExp(`<url><loc>${new URL(path, baseURL).href}</loc>[\\s\\S]*?</url>`).exec(sitemap)?.[0] ?? '';
      expect(entry, path).toContain(`<lastmod>${work.addedAt}</lastmod>`);
      expect(entry, path).toContain(`<video:content_loc>${new URL(work.renditions[0]!.src, baseURL).href}</video:content_loc>`);
      expect(entry, path).toContain(`<video:thumbnail_loc>${new URL(path.startsWith('ar/') ? work.og.ar.src : work.og.en.src, baseURL).href}</video:thumbnail_loc>`);
    }
  }
  // The same language codes as the pages' own hreflang links.
  expect(sitemap).toContain('hreflang="ar"');
  expect(sitemap).not.toContain('ar-EG');
  expect(sitemap).not.toContain('/portfolio/');
  expect(sitemap).not.toContain('/en/');
});

// Old addresses → where the same page lives now. The site was at /portfolio/ with Arabic at its root
// and English under en/; now English is at the root and Arabic under ar/.
for (const [old, path] of [
  ['portfolio/', 'ar/'],
  ['portfolio/en/', ''],
  [`portfolio/work/${slug}/`, `ar/work/${slug}/`],
  [`portfolio/en/work/${slug}/`, `work/${slug}/`],
  ['en/', ''],
  [`en/work/${slug}/`, `work/${slug}/`],
] as const) {
  test(`a link shared as /${old} still opens /${path}`, async ({ page, request, baseURL }) => {
    const target = new URL(path, baseURL).href;
    const stub = await request.get(old);
    expect(stub.status()).toBe(200);
    const html = await stub.text();
    // The canonical names the new page; browsers without JavaScript follow an instant refresh.
    expect(html).toContain(`<link rel="canonical" href="${target}">`);
    expect(html).toContain(`content="0; url=${target}"`);

    await page.goto(`${old}?utm_source=ig#about`);
    await expect(page).toHaveURL(`${target}?utm_source=ig#about`);
  });
}

test('an old /portfolio/ link to a place that never existed gets the 404 page', async ({ request }) => {
  expect((await request.get('portfolio/work/does-not-exist/')).status()).toBe(404);
});

test('browsers and Google Search find a favicon at the root of the site, in sizes Google takes', async ({ page, request }) => {
  const ico = await request.get('favicon.ico');
  expect(ico.status()).toBe(200);
  expect((await ico.body()).subarray(0, 4)).toEqual(Buffer.from([0, 0, 1, 0]));

  await page.goto('ar/');
  for (const size of [48, 96]) {
    const href = await page.locator(`link[rel="icon"][sizes="${size}x${size}"]`).getAttribute('href');
    const meta = await sharp(await (await request.get(new URL(href!, page.url()).href)).body()).metadata();
    expect([meta.width, meta.height, meta.format]).toEqual([size, size, 'png']);
  }
});
