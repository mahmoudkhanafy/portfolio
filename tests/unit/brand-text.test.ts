import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium, type Browser } from '@playwright/test';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

let browser: Browser;
beforeAll(async () => {
  // The same Chromium as the end-to-end suite: in CI, the runner's Google Chrome (PW_CHROMIUM_CHANNEL).
  browser = await chromium.launch({ channel: process.env.PW_CHROMIUM_CHANNEL || undefined, args: ['--allow-file-access-from-files'] });
});
afterAll(async () => {
  await browser?.close();
});

const ARABIC = /[؀-ۿ]/;
const LATIN = /[A-Za-z]/;

/** The words a template shows, leaving out the "mk·" mark, a logo rather than words. */
const text = async (template: string, query: string): Promise<string> => {
  const page = await browser.newPage();
  await page.goto(pathToFileURL(resolve('site/brand/templates', template)).href + query);
  if (template === 'og-work.html') await page.waitForSelector('html[data-ready="yes"]');
  const shown = await page.evaluate(() => {
    document.querySelectorAll('.mk').forEach((mark) => mark.remove());
    return document.body.innerText;
  });
  await page.close();
  return shown;
};

/** A piece's card as scripts/media/og.ts fills it, with an Arabic title and label. */
const workCard = (lang: 'ar' | 'en') =>
  '?card=' +
  encodeURIComponent(
    JSON.stringify({
      lang,
      ...(lang === 'ar'
        ? { title: 'افتتاح الكافيه', titleLang: 'ar', label: ['ريل', '0:30'], name: 'محمود خالد', role: 'مونتير ومصوّر فيديو' }
        : { title: 'Cafe opening', titleLang: 'en', label: ['Reel', '0:30'], name: 'Mahmoud Khaled', role: 'Video editor & videographer' }),
      ratio: 9 / 16,
      tint: '#1b1c17',
      still: pathToFileURL(resolve('site/portrait.png')).href,
    }),
  );

describe('the Arabic pages’ link previews', () => {
  it('the home card has no English letters, only Arabic', async () => {
    const shown = await text('og-home.html', '?ar');
    expect(shown).toContain('محمود');
    expect(shown).not.toMatch(LATIN);
  });

  it('a piece’s card names him and his role in Arabic', async () => {
    const shown = await text('og-work.html', workCard('ar'));
    expect(shown).toContain('محمود خالد');
    expect(shown).not.toMatch(LATIN);
  });
});

describe('the English pages’ link previews', () => {
  it('the home card has no Arabic letters, only English', async () => {
    const shown = await text('og-home.html', '?en');
    expect(shown).toContain('Mahmoud');
    expect(shown).not.toMatch(ARABIC);
  });

  it('a piece’s card names him and his role in English', async () => {
    const shown = await text('og-work.html', workCard('en'));
    expect(shown).toContain('Mahmoud Khaled');
    expect(shown).not.toMatch(ARABIC);
  });
});
