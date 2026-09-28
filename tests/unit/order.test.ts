import { describe, expect, it } from 'vitest';
import { sortWorks } from '../../scripts/media/order.ts';

const w = (slug: string, order: number, addedAt: string) => ({ slug, order, addedAt });

describe('sortWorks', () => {
  it('puts new uploads without an order above the curated ones', () => {
    const items = [w('old-1', 1, '2026-01-01T00:00:00.000Z'), w('old-2', 2, '2026-01-01T00:00:00.000Z'), w('new', 0, '2026-09-01T00:00:00.000Z')];
    expect(sortWorks(items).map((i) => i.slug)).toEqual(['new', 'old-1', 'old-2']);
  });

  it('shows the newest first within the same order', () => {
    const items = [w('a', 0, '2026-05-01T00:00:00.000Z'), w('b', 0, '2026-09-01T10:00:00.000Z'), w('c', 0, '2026-09-01T09:00:00.000Z')];
    expect(sortWorks(items).map((i) => i.slug)).toEqual(['b', 'c', 'a']);
  });

  it('breaks full ties by slug and honours negative orders', () => {
    const items = [w('b', 0, '2026-01-01T00:00:00.000Z'), w('a', 0, '2026-01-01T00:00:00.000Z'), w('z', -1, '2020-01-01T00:00:00.000Z')];
    expect(sortWorks(items).map((i) => i.slug)).toEqual(['z', 'a', 'b']);
  });

  it('does not reorder the caller’s array', () => {
    const items = [w('b', 2, '2026-01-01T00:00:00.000Z'), w('a', 1, '2026-01-01T00:00:00.000Z')];
    sortWorks(items);
    expect(items.map((i) => i.slug)).toEqual(['b', 'a']);
  });
});
