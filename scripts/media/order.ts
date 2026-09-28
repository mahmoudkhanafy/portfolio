/** Lower `order` first (missing counts as 0, so new uploads lead); then newest first; then by slug. */
export function sortWorks<T extends { order: number; addedAt: string; slug: string }>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => a.order - b.order || b.addedAt.localeCompare(a.addedAt) || a.slug.localeCompare(b.slug));
}
