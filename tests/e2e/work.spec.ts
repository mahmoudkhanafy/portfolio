import { expect, test } from '@playwright/test';
import { watchForProblems, works } from './helpers.ts';

const meta = (page: import('@playwright/test').Page, key: string) =>
  page.locator(`meta[property="${key}"], meta[name="${key}"]`).first().getAttribute('content');

for (const lang of ['ar', 'en'] as const) {
  for (const work of works) {
    const path = `${lang === 'en' ? 'en/' : ''}work/${work.slug}/`;

    test(`${path} has a proper link preview and a way to message`, async ({ page, request, baseURL }) => {
      const problems = watchForProblems(page);
      await page.goto(path);
      const title = lang === 'en' ? (work.title.en ?? work.title.ar) : work.title.ar;
      await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName(title);
      await expect(page).toHaveTitle(new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));

      const pageUrl = new URL(path, baseURL).href;
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', pageUrl);
      expect(await meta(page, 'og:url')).toBe(pageUrl);
      expect(await meta(page, 'og:title')).toContain(title);
      expect((await meta(page, 'og:description'))?.length).toBeGreaterThan(20);

      // WhatsApp and Instagram fetch the preview image by absolute URL; it must exist and stay small.
      const image = await meta(page, 'og:image');
      expect(image).toMatch(/^http:\/\/localhost:\d+\/mahmoud-khaled\/media\/.+\/og\.[0-9a-f]+\.jpg$/);
      expect([await meta(page, 'og:image:width'), await meta(page, 'og:image:height')]).toEqual(['1200', '630']);
      const imageResponse = await request.get(image!);
      expect(imageResponse.status()).toBe(200);
      expect(imageResponse.headers()['content-type']).toBe('image/jpeg');
      expect((await imageResponse.body()).length).toBeLessThan(300_000);

      const video = await meta(page, 'og:video');
      expect((await request.head(video!)).status()).toBe(200);

      const alternates = await page.locator('link[rel="alternate"][hreflang]').evaluateAll((links) => links.map((l) => [l.getAttribute('hreflang'), l.getAttribute('href')]));
      expect(alternates).toEqual([
        ['ar', new URL(`work/${work.slug}/`, baseURL).href],
        ['en', new URL(`en/work/${work.slug}/`, baseURL).href],
        ['x-default', new URL(`work/${work.slug}/`, baseURL).href],
      ]);

      const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent())!);
      expect(ld).toMatchObject({ '@type': 'VideoObject', name: title, url: pageUrl, uploadDate: work.addedAt });
      expect((await request.head(ld.contentUrl)).status()).toBe(200);

      const cta = await page.locator('.work__cta a[href^="https://wa.me/"]').getAttribute('href');
      const text = new URL(cta!).searchParams.get('text')!;
      expect(text).toContain(title);
      expect(text).toContain(pageUrl);
      expect(problems).toEqual([]);
    });
  }
}

test('text from a .yml file is shown exactly as written, never read as HTML', async ({ page }) => {
  const edge = works.find((w) => w.slug === 'edge-case-text');
  expect(edge, 'the e2e build adds tests/fixtures/work/ (npm run build:e2e)').toBeDefined();
  for (const lang of ['ar', 'en'] as const) {
    const problems = watchForProblems(page);
    await page.goto(`${lang === 'en' ? 'en/' : ''}work/${edge!.slug}/`);
    const description = edge!.description[lang]!;
    await expect(page.locator('.work__description')).toHaveText(description);
    await expect(page.locator('.work__tags')).toContainText(edge!.client!);
    await expect(page.locator('main b, main img[src="x"]')).toHaveCount(0);
    expect(problems).toEqual([]);
  }
  await page.goto('');
  await expect(page.locator(`#title-${edge!.slug}`)).toHaveAccessibleName(edge!.title.ar);
  await expect(page.locator('main b, main img[src="x"]')).toHaveCount(0);
});
