import { stat } from 'node:fs/promises';
import type { Runner } from './run.ts';

/**
 * When a file first arrived: the commit that added it (UTC ISO), or its modification time outside git.
 * Needs the full history in CI (checkout with fetch-depth: 0).
 */
export async function addedAt(file: string, cwd: string, runner: Runner): Promise<string> {
  try {
    const out = await runner('git', ['log', '--diff-filter=A', '--follow', '--format=%cI', '--', file], { cwd });
    const first = out.trim().split('\n').filter(Boolean).at(-1);
    if (first) return new Date(first).toISOString();
  } catch {
    // Not a git checkout, or git is missing: fall back to the file's own date.
  }
  return (await stat(file)).mtime.toISOString();
}
