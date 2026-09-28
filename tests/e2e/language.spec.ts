import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { works } from './helpers.ts';

const slug = works[0]!.slug;
const offer = (page: import('@playwright/test').Page) => page.locator('#language-offer');
// A visitor who has not picked a language yet (the other suites start with one picked).
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('a phone set to English', () => {
  test.use({ locale: 'en-US' });

  test('is offered the English page, in English, and taken to the same place in it', async ({ page }) => {
    await page.goto(`ar/work/${slug}/`);
    await expect(offer(page)).toBeVisible();
    await expect(offer(page)).toHaveAttribute('lang', 'en');
    await expect(offer(page)).toContainText('This site is in English too');
    const results = await new AxeBuilder({ page }).include('#language-offer').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    expect(results.violations.map((v) => v.id)).toEqual([]);

    await offer(page).getByRole('link', { name: 'Read in English' }).click();
    await expect(page).toHaveURL(new RegExp(`/mahmoud-khaled/work/${slug}/$`));
    await expect(offer(page)).toBeHidden();
    // Chosen: an Arabic page opened later does not ask again.
    await page.goto('ar/');
    await page.waitForLoadState('load');
    await expect(offer(page)).toBeHidden();
  });

  test('keeps the #place when it switches', async ({ page }) => {
    await page.goto('ar/#about');
    await expect(offer(page).getByRole('link')).toHaveAttribute('href', /\/mahmoud-khaled\/#about$/);
  });

  test('stays on Arabic once the offer is closed', async ({ page }) => {
    await page.goto('ar/');
    await offer(page).getByRole('button', { name: 'Close' }).click();
    await expect(offer(page)).toBeHidden();
    await page.reload();
    await page.waitForLoadState('load');
    await expect(offer(page)).toBeHidden();
  });

  test('is not asked again after using the language switch itself', async ({ page }) => {
    await page.goto('ar/');
    await page.locator('.site-header').getByRole('link', { name: 'Read this site in English' }).click();
    await expect(page).toHaveURL(/\/mahmoud-khaled\/$/);
    await page.goto('ar/');
    await page.waitForLoadState('load');
    await expect(offer(page)).toBeHidden();
  });

  test('is not offered anything on an English page', async ({ page }) => {
    await page.goto('');
    await page.waitForLoadState('load');
    await expect(offer(page)).toBeHidden();
  });
});

test.describe('a phone set to Arabic', () => {
  test.use({ locale: 'ar-EG' });

  test('is offered the Arabic page, in Arabic, from an English one', async ({ page }) => {
    await page.goto(`work/${slug}/`);
    await expect(offer(page)).toHaveAttribute('lang', 'ar');
    await offer(page).getByRole('link', { name: 'اقرأه بالعربي' }).click();
    await expect(page).toHaveURL(new RegExp(`/mahmoud-khaled/ar/work/${slug}/$`));
  });

  test('is not offered anything on an Arabic page', async ({ page }) => {
    await page.goto('ar/');
    await page.waitForLoadState('load');
    await expect(offer(page)).toBeHidden();
  });
});
