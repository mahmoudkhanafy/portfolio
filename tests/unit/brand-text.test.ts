import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium, type Browser } from '@playwright/test';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

let browser: Browser;
beforeAll(async () => {
  browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });
});
afterAll(async () => {
  await browser?.close();
});

const text = async (template: string, query: string): Promise<string> => {
  const page = await browser.newPage();
  await page.goto(pathToFileURL(resolve('site/brand/templates', template)).href + query);
  const shown = await page.evaluate(() => document.body.innerText);
  await page.close();
  return shown;
};

describe('the Arabic pages’ link previews (npm run brand)', () => {
  it.each(['og-home.html', 'wordmark.html'])('%s has no English letters, only Arabic', async (template) => {
    const shown = await text(template, '');
    expect(shown).toContain('محمود خالد');
    expect(shown).not.toMatch(/[A-Za-z]/);
  });
});

describe('the English pages’ link previews (npm run brand)', () => {
  it.each(['og-home.html', 'wordmark.html'])('%s?en has no Arabic letters, only English', async (template) => {
    const shown = await text(template, '?en');
    expect(shown).toContain('Mahmoud Khaled');
    expect(shown).not.toMatch(/[؀-ۿ]/);
  });
});
