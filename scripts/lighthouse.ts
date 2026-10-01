/**
 * Lighthouse on the production build, served the way GitHub Pages serves it.
 * Builds with a matching origin, then audits the English home, the Arabic home and one video page
 * with Lighthouse's mobile (throttled 4G) and desktop presets. Reports go to reports/lighthouse/.
 *
 *   npm run lighthouse
 */
import { execFileSync, spawn } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';
import type { AddressInfo } from 'node:net';
import { DEFAULT_BASE } from './config.ts';
import { createPagesServer } from './serve.ts';

const PORT = 4749;
const origin = `http://localhost:${PORT}`;
const outDir = 'dist-lighthouse';
const reports = 'reports/lighthouse';

execFileSync('npm', ['run', 'build'], { stdio: 'inherit', env: { ...process.env, SITE_URL: origin, OUT_DIR: outDir } });
const catalog = JSON.parse(readFileSync('src/generated/catalog.json', 'utf8')) as { works: Array<{ slug: string }> };
const pages = [
  ['home-en', ''],
  ['home-ar', 'ar/'],
  ['work-ar', `ar/work/${catalog.works[0]!.slug}/`],
];

/** Runs a command without blocking this process, which is also serving the pages being audited. */
const run = (command: string, args: string[]): Promise<number> =>
  new Promise((resolve, reject) => spawn(command, args, { stdio: 'inherit' }).on('error', reject).on('exit', (code) => resolve(code ?? 1)));

const server = createPagesServer({ root: outDir, base: DEFAULT_BASE });
await new Promise<void>((resolve) => server.listen(PORT, '127.0.0.1', resolve));
console.log(`Serving ${outDir} on port ${(server.address() as AddressInfo).port}`);
mkdirSync(reports, { recursive: true });

const rows: string[] = [];
try {
  for (const preset of ['mobile', 'desktop'] as const) {
    for (const [name, path] of pages) {
      const target = `${origin}${DEFAULT_BASE}${path}`;
      const output = `${reports}/${name}-${preset}`;
      const status = await run(
        'npx',
        [
          'lighthouse',
          target,
          ...(preset === 'desktop' ? ['--preset=desktop'] : []),
          '--output=json',
          '--output=html',
          `--output-path=${output}`,
          '--chrome-flags=--headless=new --no-first-run',
          '--quiet',
        ],
      );
      if (status !== 0) throw new Error(`Lighthouse failed for ${target}`);
      const report = JSON.parse(readFileSync(`${output}.report.json`, 'utf8')) as {
        categories: Record<string, { score: number | null }>;
        audits: Record<string, { displayValue?: string }>;
      };
      const score = (key: string) => Math.round((report.categories[key]?.score ?? 0) * 100);
      rows.push(
        `| ${name} | ${preset} | ${score('performance')} | ${score('accessibility')} | ${score('best-practices')} | ${score('seo')} | ${report.audits['largest-contentful-paint']?.displayValue ?? ''} | ${report.audits['cumulative-layout-shift']?.displayValue ?? ''} | ${report.audits['total-blocking-time']?.displayValue ?? ''} |`,
      );
    }
  }
} finally {
  server.close();
}

console.log('\n| Page | Preset | Performance | Accessibility | Best practices | SEO | LCP | CLS | TBT |');
console.log('|---|---|---|---|---|---|---|---|---|');
for (const row of rows) console.log(row);
