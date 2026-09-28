import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// Invisible characters in source (BOM, line/paragraph separators, zero-width and bidi controls,
// stray combining marks) change behaviour without showing up in review. Escapes like \u2028 are fine.
const INVISIBLE = /[\uFEFF\u2028\u2029\u200B-\u200F\u202A-\u202E\u2066-\u2069\u0300-\u036F]/;
const ROOTS = ['src', 'scripts', 'tests', 'site/brand/templates', 'work'];
const EXTENSIONS = /\.(ts|astro|css|html|mjs|yml)$/;

function* files(dir: string): Generator<string> {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      if (name !== 'generated' && name !== 'fixtures') yield* files(path);
    } else if (EXTENSIONS.test(name)) {
      yield path;
    }
  }
}

describe('source hygiene', () => {
  it('has no invisible Unicode characters in source files', () => {
    const offenders: string[] = [];
    for (const root of ROOTS) {
      for (const file of files(root)) {
        readFileSync(file, 'utf8')
          .split('\n')
          .forEach((line, i) => {
            const hit = line.match(INVISIBLE);
            if (hit) offenders.push(`${file}:${i + 1} U+${hit[0].codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0')}`);
          });
      }
    }
    expect(offenders).toEqual([]);
  });
});
