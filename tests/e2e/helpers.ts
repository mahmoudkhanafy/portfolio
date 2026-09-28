import { readFileSync } from 'node:fs';
import type { Page } from '@playwright/test';
import type { Catalog } from '../../src/lib/catalog-types.ts';

/** The catalog the build was made from, so tests follow whatever is in work/. */
export const catalog: Catalog = JSON.parse(readFileSync(new URL('../../src/generated/catalog.json', import.meta.url), 'utf8'));
export const works = catalog.works;

/** Collects failed requests and console errors while a page is used. */
export function watchForProblems(page: Page): string[] {
  const problems: string[] = [];
  page.on('response', (response) => {
    if (response.status() >= 400) problems.push(`HTTP ${response.status()} ${response.url()}`);
  });
  page.on('requestfailed', (request) => {
    // Media requests are cancelled by design when a player stops or switches rendition.
    if (!/\.mp4($|\?)/.test(request.url())) problems.push(`failed ${request.url()} ${request.failure()?.errorText}`);
  });
  page.on('pageerror', (error) => problems.push(`page error: ${error.message}`));
  page.on('console', (message) => {
    // Playwright's WebKit build lacks some native media-control artwork; that is not the site's error.
    if (message.type() === 'error' && !/Button failed to load/.test(message.text())) problems.push(`console: ${message.text()}`);
  });
  return problems;
}

/** Current state of the first <video> inside a player root. */
export const videoState = (page: Page, root = '[data-player]') =>
  page.locator(root).first().evaluate((el) => {
    const video = el.querySelector('video');
    return video
      ? { exists: true, time: video.currentTime, paused: video.paused, muted: video.muted, controls: video.controls, src: video.currentSrc }
      : { exists: false, time: 0, paused: true, muted: true, controls: false, src: '' };
  });
