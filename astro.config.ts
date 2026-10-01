import { defineConfig, fontProviders } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { DEFAULT_BASE, DEFAULT_PORT } from './scripts/config.ts';
import { normalizeBase } from './src/lib/urls.ts';

// GitHub Actions passes the Pages origin and repo sub-path; local builds use the defaults.
const site = (process.env.SITE_URL || `http://localhost:${DEFAULT_PORT}`).replace(/\/+$/, '');
const base = normalizeBase(process.env.BASE_PATH ?? DEFAULT_BASE);

/**
 * Self-hosted fonts, checked in under site/fonts (see its README): Noto Sans Arabic for all text, split
 * so a page fetches only the scripts it uses, and Barlow Condensed for English display lines.
 */
/** Standard Arabic and the borrowed letters Egyptian text uses (پ چ ڤ گ ی); anything else falls back. */
const ARABIC = ['U+0600-0670', 'U+067E', 'U+0686', 'U+06A4', 'U+06AF', 'U+06CC', 'U+06D4', 'U+200C-200F', 'U+FEFF'];
const LATIN = ['U+0000-00FF', 'U+0131', 'U+0152-0153', 'U+02BB-02BC', 'U+02C6', 'U+02DA', 'U+02DC', 'U+0304', 'U+0308', 'U+0329', 'U+2000-206F', 'U+20AC', 'U+2122', 'U+2191', 'U+2193', 'U+2212', 'U+2215', 'U+FFFD'];
const font = (file: string, weight: string, unicodeRange?: string[]) => ({
  src: [`./site/fonts/${file}`] as [string],
  weight,
  style: 'normal' as const,
  ...(unicodeRange && { unicodeRange: unicodeRange as [string, ...string[]] }),
});

export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  outDir: process.env.OUT_DIR || 'dist',
  build: { format: 'directory', inlineStylesheets: 'always' },
  server: { port: DEFAULT_PORT, host: true },
  integrations: [sitemap({ i18n: { defaultLocale: 'en', locales: { en: 'en', ar: 'ar-EG' } } })],
  fonts: [
    {
      provider: fontProviders.local(),
      name: 'Noto Sans Arabic',
      cssVariable: '--font-sans',
      fallbacks: ['sans-serif'],
      options: { variants: [font('noto-sans-arabic.woff2', '400 800', ARABIC), font('noto-sans-latin.woff2', '400 800', LATIN)] },
    },
    {
      provider: fontProviders.local(),
      name: 'Barlow Condensed',
      cssVariable: '--font-display',
      fallbacks: ['sans-serif'],
      options: { variants: [font('barlow-condensed-600.woff2', '600')] },
    },
  ],
});
