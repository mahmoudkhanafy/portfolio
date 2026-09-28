import { readFileSync } from 'node:fs';
import { defineConfig, fontProviders } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { DEFAULT_BASE, DEFAULT_PORT } from './scripts/config.ts';
import { normalizeBase } from './src/lib/urls.ts';

// GitHub Actions passes the Pages origin and repo sub-path; local builds use the defaults.
const site = (process.env.SITE_URL || `http://localhost:${DEFAULT_PORT}`).replace(/\/+$/, '');
const base = normalizeBase(process.env.BASE_PATH ?? DEFAULT_BASE);

/**
 * Self-hosted variable fonts from Fontsource packages, one @font-face per script subset.
 * The local provider keeps builds offline and lets the browser fetch only the scripts a page uses.
 */
function fontsource(pkg: string, file: string, subsets: string[]) {
  const ranges: Record<string, string> = JSON.parse(readFileSync(`node_modules/${pkg}/unicode.json`, 'utf8'));
  const variants = subsets.map((subset) => {
    const range = ranges[subset];
    if (!range) throw new Error(`${pkg} has no "${subset}" subset`);
    return {
      src: [`./node_modules/${pkg}/files/${file}-${subset}-wght-normal.woff2`] as [string],
      weight: '100 900',
      style: 'normal' as const,
      unicodeRange: range.split(',') as [string, ...string[]],
    };
  });
  return { variants: variants as [(typeof variants)[number], ...typeof variants] };
}

export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  outDir: process.env.OUT_DIR || 'dist',
  build: { format: 'directory', inlineStylesheets: 'always' },
  server: { port: DEFAULT_PORT, host: true },
  integrations: [sitemap({ i18n: { defaultLocale: 'ar', locales: { ar: 'ar-EG', en: 'en' } } })],
  fonts: [
    {
      provider: fontProviders.local(),
      name: 'Alexandria',
      cssVariable: '--font-sans',
      fallbacks: ['sans-serif'],
      options: fontsource('@fontsource-variable/alexandria', 'alexandria', ['arabic', 'latin']),
    },
  ],
});
