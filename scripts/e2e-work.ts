/**
 * Lays out the video folder the e2e build is made from: everything in work/ plus the test pieces in
 * tests/fixtures/work/ (titles with quotes, HTML, emoji and long unbroken words), so the suite checks
 * the site against text Mahmoud might paste, not only against the seed content.
 *
 *   node scripts/e2e-work.ts   → .e2e-work/ (linked, not copied)
 */
import { copyFile, link, mkdir, readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';

const out = '.e2e-work';
await rm(out, { recursive: true, force: true });
await mkdir(out);
for (const dir of ['work', 'tests/fixtures/work']) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    const from = join(dir, entry.name);
    const to = join(out, entry.name);
    try {
      await link(from, to);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'EEXIST') throw new Error(`${from}: a file with this name is already in ${out}`);
      await copyFile(from, to);
    }
  }
}
console.log(`✓ ${out}: work/ + tests/fixtures/work/`);
